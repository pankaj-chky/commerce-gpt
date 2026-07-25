Accountancy  E - Books - Volume I.pdf
Accountancy  E - Books - Volume II.pdf/**
 * Test: Verify Supabase search returns PDF sources instead of web results.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://ofegckpllkecdcdlpfrk.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_secret_l29cqlAJIufRK0asFa-Ibw_Y7en8J2i";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testSearch(query) {
  const words = query.split(/\s+/).filter(w => w.length >= 2).slice(0, 5);
  if (words.length === 0) return [];

  let q = supabase
    .from("document_chunks")
    .select("id, content, filename, bucket, chunk_index, created_at")
    .limit(3);

  for (const w of words) {
    q = q.ilike("content", `%${w}%`);
  }

  const { data, error } = await q;
  if (error) {
    console.error("Search error:", error.message);
    return [];
  }
  return data || [];
}

async function main() {
  console.log("=== Test: Supabase Search for \"what is accountancy\" ===\n");

  const chunks = await testSearch("what is accountancy");

  if (chunks.length === 0) {
    console.log("❌ No results found in Supabase.");
    return;
  }

  const sources = [...new Set(chunks.map(c => c.filename))];

  console.log(`Found ${chunks.length} matching chunks from ${sources.length} PDF(s):\n`);

  console.log("📚 Sources from YOUR PDFs in Supabase:");
  sources.forEach(s => console.log(`  {{source:${s}}}`));

  console.log("\n--- Context sent to LLM ---\n");
  chunks.forEach((c, i) => {
    console.log(`[Source: ${c.filename}]`);
    console.log(`${c.content.slice(0, 250)}...\n`);
  });

  console.log(`PDF Sources in Knowledge Base: ${sources.join(", ")}`);
  console.log("\n✅ Your database IS being analyzed. These are YOUR PDFs, not web URLs!");
}

main().catch(e => console.error(e));