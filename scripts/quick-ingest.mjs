/**
 * Quick Ingestion: Extracts 2 accountancy PDFs and stores in Supabase.
 * Run: node scripts/quick-ingest.mjs
 */
import { createClient } from "@supabase/supabase-js";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://ofegckpllkecdcdlpfrk.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_secret_l29cqlAJIufRK0asFa-Ibw_Y7en8J2i";
const BUCKET = "Commerce GPT";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function chunkText(text, maxSize = 1000, overlap = 100) {
  if (!text || text.length < 50) return [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = "";
  for (const s of sentences) {
    if ((current + " " + s).length > maxSize && current.length > 0) {
      chunks.push(current.trim());
      current = current.slice(-overlap) + " " + s;
    } else {
      current += (current ? " " : "") + s;
    }
  }
  if (current.trim().length > 50) chunks.push(current.trim());
  return chunks;
}

async function extractPdfText(buffer) {
  const data = new Uint8Array(buffer);
  let doc;
  try {
    doc = await pdfjs.getDocument({ data }).promise;
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(x => x.str).join(" ") + "\n";
    }
    return text.trim();
  } catch (e) {
    console.error("  PDF extraction error:", e.message);
    return "";
  } finally {
    try { doc?.destroy?.(); } catch {}
    try { doc?.cleanup?.(); } catch {}
  }
}

async function main() {
  console.log("=== Quick Ingestion: Accountancy PDFs → Supabase ===\n");

  const testPdfs = [
    "Accountancy  E - Books - Volume I.pdf",
    "Accountancy  E - Books - Volume II.pdf",
  ];

  let totalStored = 0;

  for (const name of testPdfs) {
    console.log(`Processing: ${name}`);
    const { data: dlData, error: dlErr } = await supabase.storage.from(BUCKET).download(name);

    if (dlErr || !dlData) {
      console.log(`  ❌ Download failed: ${dlErr?.message}\n`);
      continue;
    }

    const buffer = Buffer.from(await dlData.arrayBuffer());
    console.log(`  Size: ${(buffer.length / 1024 / 1024).toFixed(1)} MB`);

    const text = await extractPdfText(buffer);
    console.log(`  Extracted: ${text.length} chars`);
    if (text.length < 100) {
      console.log(`  ⚠ Not enough text\n`);
      continue;
    }

    const chunks = chunkText(text);
    console.log(`  Chunks: ${chunks.length}`);

    // Delete old chunks for this file
    await supabase.from("document_chunks").delete().eq("filename", name);

    // Insert in batches
    const BATCH = 10;
    for (let i = 0; i < chunks.length; i += BATCH) {
      const batch = chunks.slice(i, i + BATCH).map((c, idx) => ({
        content: c,
        filename: name,
        bucket: BUCKET,
        chunk_index: i + idx,
      }));
      const { error } = await supabase.from("document_chunks").insert(batch);
      if (error) {
        console.log(`  ❌ DB insert error: ${error.message}`);
        break;
      }
      process.stdout.write(`  ✓ Batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(chunks.length / BATCH)}\r`);
    }
    console.log(`\n  ✅ ${chunks.length} chunks stored`);
    totalStored += chunks.length;
  }

  // Verify
  const { count, error: countErr } = await supabase
    .from("document_chunks")
    .select("*", { count: "exact", head: true });

  console.log(`\nTotal chunks in Supabase: ${count ?? totalStored}`);
  console.log("\nDone! Restart dev server and test a question about accountancy.");
}

main().catch(e => {
  console.error("Fatal:", e);
  process.exit(1);
});