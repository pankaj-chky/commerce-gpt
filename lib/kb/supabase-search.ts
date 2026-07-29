import { getSupabaseServerClient } from "@/lib/supabase/client";

export interface DocumentChunk {
  id: string;
  content: string;
  filename: string;
  bucket?: string;
  chunk_index?: number;
  created_at?: string;
}

export interface ChunkInput {
  content: string;
  filename: string;
  bucket?: string;
  chunkIndex?: number;
}

/**
 * Store document chunks in Supabase.
 */
export async function storeChunks(chunks: ChunkInput[]): Promise<number> {
  if (chunks.length === 0) return 0;

  const supabase = getSupabaseServerClient();

  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE).map((c) => ({
      content: c.content,
      filename: c.filename,
      bucket: c.bucket || null,
      chunk_index: c.chunkIndex ?? 0,
    }));

    const { error } = await supabase.from("document_chunks").insert(batch as any);

    if (error) {
      console.error(`[Supabase Search] Insert error:`, error.message);
      throw error;
    }

    inserted += batch.length;
  }

  return inserted;
}

/**
 * Common English stop words + question words that shouldn't be used as search filters.
 * These words appear in almost every sentence and would filter out all results.
 */
const STOP_WORDS = new Set([
  "what", "how", "why", "when", "where", "who", "whom", "which",
  "is", "are", "was", "were", "be", "been", "being",
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "from", "by", "as", "into", "about", "like",
  "do", "does", "did", "has", "have", "had", "can", "could",
  "will", "would", "shall", "should", "may", "might", "must",
  "it", "its", "they", "them", "their", "he", "she", "his", "her",
  "this", "that", "these", "those", "i", "me", "my", "we", "our",
  "so", "if", "than", "then", "also", "just", "only",
  "explain", "define", "describe", "tell", "give", "show",
  "please", "help", "need", "want", "say", "means", "meaning",
  "difference", "between", "compare", "contrast",
  "calculate", "find", "compute", "determine",
]);

/**
 * Extract meaningful keywords from a query, filtering out stop words and short terms.
 * Returns keywords sorted by length descending (longer words are more specific).
 */
function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,;.!?()]+/)
    .map(w => w.trim())
    .filter(w => w.length >= 2 && !STOP_WORDS.has(w))
    .sort((a, b) => b.length - a.length)
    .slice(0, 8);
}

/**
 * Score a chunk by how many keywords it matches (case-insensitive).
 */
function scoreChunk(content: string, keywords: string[]): number {
  const lower = content.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) {
      score += kw.length; // longer keyword matches = higher score
    }
  }
  return score;
}

/**
 * Search document chunks using ILIKE and OR logic.
 * First tries strict AND matching. If no results, falls back to OR
 * with any meaningful keyword, then ranks by match count.
 */
export async function searchChunks(
  query: string,
  limit: number = 5
): Promise<DocumentChunk[]> {
  const supabase = getSupabaseServerClient();
  const keywords = extractKeywords(query);

  if (keywords.length === 0) return [];

  // Stage 1: Try AND query (all keywords must match)
  let dbQuery = supabase
    .from("document_chunks")
    .select("id, content, filename, bucket, chunk_index, created_at")
    .limit(limit * 3); // fetch extra for dedup + ranking

  for (const kw of keywords.slice(0, 4)) {
    dbQuery = dbQuery.ilike("content", `%${kw}%`);
  }

  const { data: andResults, error: andError } = await dbQuery;

  if (!andError && andResults && andResults.length > 0) {
    return (andResults as DocumentChunk[]).slice(0, limit);
  }

  // Stage 2: Fallback to OR — search each keyword individually and merge
  const seen = new Set<string>();
  const allChunks: DocumentChunk[] = [];

  for (const kw of keywords.slice(0, 4)) {
    const { data, error } = await supabase
      .from("document_chunks")
      .select("id, content, filename, bucket, chunk_index, created_at")
      .ilike("content", `%${kw}%`)
      .limit(10);

    if (!error && data) {
      for (const chunk of data as DocumentChunk[]) {
        if (!seen.has(chunk.id)) {
          seen.add(chunk.id);
          allChunks.push(chunk);
        }
      }
    }
  }

  // Rank by keyword match count (how many keywords appear in the chunk)
  allChunks.sort((a, b) => {
    const aScore = scoreChunk(a.content, keywords);
    const bScore = scoreChunk(b.content, keywords);
    return bScore - aScore;
  });

  const topResults = allChunks.slice(0, limit);

  if (topResults.length > 0) {
    return topResults;
  }

  // Stage 3: Last resort — try the most specific keyword with a shorter prefix
  const bestKw = keywords[0];
  const { data: lastResort } = await supabase
    .from("document_chunks")
    .select("id, content, filename, bucket, chunk_index, created_at")
    .ilike("content", `%${bestKw}%`)
    .limit(limit);

  return (lastResort as DocumentChunk[]) || [];
}

/**
 * Get all unique PDF filenames stored in the database.
 */
export async function getChunkSources(): Promise<string[]> {
  const supabase = getSupabaseServerClient();

  // Fetch all rows with a large limit (Supabase caps at project max, default 1000)
  // Use pagination to ensure we get all unique filenames
  const sources = new Set<string>();
  const pageSize = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("document_chunks")
      .select("filename")
      .range(offset, offset + pageSize - 1)
      .order("filename", { ascending: true });

    if (error || !data || data.length === 0) {
      hasMore = false;
      break;
    }

    for (const row of data as any[]) {
      sources.add(row.filename);
    }

    if (data.length < pageSize) {
      hasMore = false;
    } else {
      offset += pageSize;
    }
  }

  return Array.from(sources).sort();
}

/**
 * Get total chunk count.
 */
export async function getChunkCount(): Promise<number> {
  const supabase = getSupabaseServerClient();

  const { count, error } = await supabase
    .from("document_chunks")
    .select("*", { count: "exact", head: true });

  if (error) return 0;
  return count ?? 0;
}

/**
 * Delete all chunks for a given filename (for re-ingestion).
 */
export async function deleteChunksByFilename(filename: string): Promise<void> {
  const supabase = getSupabaseServerClient();

  const { error } = await supabase
    .from("document_chunks")
    .delete()
    .eq("filename", filename);

  if (error) {
    console.error(`[Supabase Search] Delete error:`, error.message);
    throw error;
  }
}

/**
 * Delete all chunks (reset the knowledge base).
 */
export async function deleteAllChunks(): Promise<void> {
  const supabase = getSupabaseServerClient();

  const { error } = await supabase
    .from("document_chunks")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    console.error(`[Supabase Search] Delete all error:`, error.message);
    throw error;
  }
}

/**
 * Create the document_chunks table if it doesn't exist.
 * Uses a raw SQL query via Supabase's REST API RPC.
 */
export async function ensureTableExists(): Promise<boolean> {
  const supabase = getSupabaseServerClient();

  // Try to select from the table - if it fails, table doesn't exist
  const { error } = await supabase
    .from("document_chunks")
    .select("id")
    .limit(1);

  if (!error) return true; // Table exists

  // Table doesn't exist - try to create it via rpc
  // This may fail but we catch gracefully
  try {
    const { error: createError } = await supabase.rpc("create_document_chunks_table");
    if (!createError) return true;
  } catch {
    // RPC not available, table must be created manually
  }

  return false;
}