/**
 * Commerce GPT PDF Ingestion Script (Supabase DB)
 *
 * Downloads ALL PDFs from Supabase Storage, extracts text via pdfjs-dist,
 * and stores chunks directly in Supabase's document_chunks table
 * (no embeddings or vector store needed — uses PostgreSQL ILIKE search).
 *
 * Run: node scripts/ingest-pdfs.mjs
 */
import { createClient } from "@supabase/supabase-js";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://ofegckpllkecdcdlpfrk.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_secret_l29cqlAJIufRK0asFa-Ibw_Y7en8J2i";
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "Commerce GPT";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BATCH_SIZE = 10;

function chunkText(text, maxSize = 1000, overlap = 100) {
  if (!text || text.length < 50) return [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + " " + sentence).length > maxSize && current.length > 0) {
      chunks.push(current.trim());
      current = current.slice(-overlap) + " " + sentence;
    } else {
      current += (current ? " " : "") + sentence;
    }
  }
  if (current.trim().length > 50) chunks.push(current.trim());
  return chunks;
}

async function extractPdfText(buffer) {
  let doc;
  try {
    const data = new Uint8Array(buffer);
    doc = await pdfjs.getDocument({ data }).promise;
    let fullText = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(item => item.str).join(" ") + "\n";
    }
    return fullText.trim();
  } catch (e) {
    console.log(`  ⚠ PDF error: ${e.message.slice(0, 100)}`);
    return "";
  } finally {
    try { doc?.destroy?.(); } catch {}
    try { doc?.cleanup?.(); } catch {}
  }
}

async function storeChunksInSupabase(chunks, filename) {
  // Delete old chunks for this file first (supports re-ingestion)
  await supabase.from("document_chunks").delete().eq("filename", filename);

  let stored = 0;
  for (let start = 0; start < chunks.length; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE, chunks.length);
    const batch = chunks.slice(start, end);
    const rows = batch.map((text, idx) => ({
      content: text,
      filename,
      bucket: BUCKET,
      chunk_index: start + idx,
    }));
    const { error } = await supabase.from("document_chunks").insert(rows);
    if (error) {
      console.log(`\n  ⚠ DB insert error: ${error.message.slice(0, 100)}`);
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }
    stored += batch.length;
    process.stdout.write(`  ✓ ${stored}/${chunks.length}\r`);
  }
  return stored;
}

async function main() {
  console.log("=== Commerce GPT: ALL PDFs → Supabase DB ===\n");
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log(`Bucket: "${BUCKET}"\n`);

  // List ALL PDFs
  console.log("Listing PDFs...");
  const { data, error } = await supabase.storage.from(BUCKET).list("", { limit: 500 });
  if (error) { console.error("Error:", error); process.exit(1); }

  const pdfs = (data || []).filter(f => f.name?.endsWith(".pdf"));
  console.log(`Found ${pdfs.length} PDFs\n`);

  // Sort by size (smallest first — faster processing start)
  pdfs.sort((a, b) => (a.metadata?.size || 0) - (b.metadata?.size || 0));

  let totalChunks = 0;
  let totalFiles = 0;

  for (let i = 0; i < pdfs.length; i++) {
    const pdf = pdfs[i];
    const filename = pdf.name;

    console.log(`[${i + 1}/${pdfs.length}] ${filename}`);

    // Skip already ingested files (check if chunks exist)
    const { count: existingCount } = await supabase
      .from("document_chunks")
      .select("*", { count: "exact", head: true })
      .eq("filename", filename);

    if (existingCount && existingCount > 0) {
      console.log(`  ✓ Already in DB (${existingCount} chunks)\n`);
      totalFiles++;
      totalChunks += existingCount;
      continue;
    }

    // Download PDF
    const { data: dlData, error: dlErr } = await supabase.storage.from(BUCKET).download(filename);
    if (dlErr || !dlData) {
      console.log(`  ❌ Download failed: ${dlErr?.message}\n`);
      continue;
    }

    const buffer = Buffer.from(await dlData.arrayBuffer());
    console.log(`  Size: ${(buffer.length / 1024 / 1024).toFixed(1)} MB`);

    const text = await extractPdfText(buffer);
    if (text.length < 100) {
      console.log(`  ⚠ Too little text (${text.length} chars)\n`);
      continue;
    }
    console.log(`  Text: ${text.length} chars`);

    const chunks = chunkText(text);
    console.log(`  Chunks: ${chunks.length}`);

    if (chunks.length === 0) {
      console.log(`  No valid chunks\n`);
      continue;
    }

    const stored = await storeChunksInSupabase(chunks, filename);
    if (stored > 0) {
      totalChunks += stored;
      totalFiles++;
      console.log(`\n  ✅ Stored ${stored} chunks\n`);
    }
  }

  // Get total count from DB
  const { count } = await supabase
    .from("document_chunks")
    .select("*", { count: "exact", head: true });

  console.log("\n" + "=".repeat(50));
  console.log("✅ INGESTION COMPLETE");
  console.log(`Files ingested: ${totalFiles}/${pdfs.length}`);
  console.log(`Total chunks in Supabase: ${count ?? totalChunks}`);
  console.log("=".repeat(50));
  console.log("\nRestart dev server and test: http://localhost:3000\n");
}

main().catch(e => {
  console.error("Fatal error:", e);
  process.exit(1);
});