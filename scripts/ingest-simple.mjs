/**
 * Simple PDF Ingestion - Calls the /api/kb/ingest-single route.
 * Downloads PDFs from Supabase Storage and sends them to the API,
 * which handles Unstructured partitioning and Supabase database storage.
 * 
 * Run: node scripts/ingest-simple.mjs
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
  process.exit(1);
}

async function main() {
  console.log("=== PDF Ingestion → Supabase DB ===\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // List PDFs
  const { data, error } = await supabase.storage.from(BUCKET).list("", { limit: 100 });
  if (error) {
    console.error("Error listing bucket:", error);
    process.exit(1);
  }

  const pdfs = (data || []).filter(f => f.name?.endsWith(".pdf"));
  console.log(`Found ${pdfs.length} PDFs to process\n`);

  for (let i = 0; i < pdfs.length; i++) {
    const pdf = pdfs[i];
    console.log(`[${i + 1}/${pdfs.length}] ${pdf.name}`);

    // Download PDF
    const { data: dlData, error: dlErr } = await supabase.storage.from(BUCKET).download(pdf.name);
    if (dlErr || !dlData) {
      console.log(`  ❌ Download failed\n`);
      continue;
    }

    // Convert to base64
    const buffer = Buffer.from(await dlData.arrayBuffer());
    const base64 = buffer.toString("base64");

    // Call the ingest-single API route (Unstructured → Supabase DB)
    try {
      const response = await fetch("http://localhost:3000/api/kb/ingest-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: base64,
          filename: pdf.name,
          bucket: BUCKET,
        }),
      });

      const result = await response.json();
      console.log(`  ✅ Chunks stored in Supabase: ${result.ingestedChunks}\n`);
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}\n`);
    }

    // Brief pause between files
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log("Done! Run the app at http://localhost:3000");
}

main().catch(e => {
  console.error("Fatal:", e);
  process.exit(1);
});