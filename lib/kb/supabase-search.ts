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
 * Search document chunks using ILIKE (case-insensitive substring matching).
 * Each word in the query must appear somewhere in the content.
 */
export async function searchChunks(
  query: string,
  limit: number = 5
): Promise<DocumentChunk[]> {
  const supabase = getSupabaseServerClient();

  const words = query
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .slice(0, 5);

  if (words.length === 0) {
    return [];
  }

  let dbQuery = supabase
    .from("document_chunks")
    .select("id, content, filename, bucket, chunk_index, created_at")
    .limit(limit);

  for (const word of words) {
    dbQuery = dbQuery.ilike("content", `%${word}%`);
  }

  const { data, error } = await dbQuery;

  if (error) {
    console.error(`[Supabase Search] ILIKE error:`, error.message);
    return [];
  }

  return (data as DocumentChunk[]) || [];
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