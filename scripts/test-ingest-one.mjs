/**
 * Test: Ingest ONE PDF by calling the /api/kb/ingest-single route.
 * This verifies the full pipeline: Unstructured → Supabase DB.
 * 
 * Run: node scripts/test-ingest-one.mjs
 * Prerequisites: 
 *   1. Start the dev server: npm run dev
 *   2. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 *   3. Run the SQL migration: supabase/migrations/001_document_chunks.sql
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "Commerce GPT";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  console.error("Create a .env file with these values, or set them directly in your shell.");
  process.exit(1);
}

async function main() {
  console.log("=== Testing single PDF ingestion → Supabase ===\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // List PDFs
  const { data, error } = await supabase.storage.from(BUCKET).list("", { limit: 10 });
  if (error) {
    console.error("Error listing bucket:", error);
    process.exit(1);
  }

  const pdfs = (data || []).filter(f => f.name?.endsWith(".pdf"));
  console.log(`Found ${pdfs.length} PDFs`);

  if (pdfs.length === 0) {
    console.log("No PDFs found in bucket!");
    process.exit(1);
  }

  // Pick the first PDF
  const pdf = pdfs[0];
  console.log(`\nIngesting: ${pdf.name}\n`);

  // Download PDF
  const { data: dlData, error: dlErr } = await supabase.storage.from(BUCKET).download(pdf.name);
  if (dlErr || !dlData) {
    console.error("Download failed:", dlErr);
    process.exit(1);
  }

  const buffer = Buffer.from(await dlData.arrayBuffer());
  const fileBase64 = buffer.toString("base64");

  console.log(`PDF size: ${buffer.length} bytes`);

  // Send to the ingest-single API route (Unstructured → Supabase DB)
  console.log("Calling /api/kb/ingest-single...");
  try {
    const response = await fetch("http://localhost:3000/api/kb/ingest-single", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileBase64,
        filename: pdf.name,
        bucket: BUCKET,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`API error ${response.status}: ${err}`);
      process.exit(1);
    }

    const result = await response.json();
    console.log(`✅ Success — ${result.ingestedChunks} chunks stored in Supabase for "${result.filename}"`);
  } catch (e) {
    console.error("Error calling ingest endpoint:", e.message);
    console.error("\nMake sure the dev server is running: npm run dev");
    process.exit(1);
  }
}

main().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});