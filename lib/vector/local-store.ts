import fs from "fs";
import path from "path";

const STORE_DIR = path.join(process.cwd(), "data", "vectors");
const INDEX_FILE = path.join(STORE_DIR, "index.json");

export interface LocalVectorRecord {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
}

interface IndexData {
  records: LocalVectorRecord[];
}

function ensureDir() {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
}

function readIndex(): IndexData {
  ensureDir();
  if (!fs.existsSync(INDEX_FILE)) {
    return { records: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, "utf-8"));
  } catch {
    return { records: [] };
  }
}

function writeIndex(data: IndexData) {
  ensureDir();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Upsert vectors into the local store.
 * If a record with the same id exists, it will be replaced.
 */
export async function upsertLocalVectors(
  chunks: { id: string; content: string; embedding: number[]; metadata: Record<string, any> }[]
) {
  const index = readIndex();
  const existingIds = new Set(index.records.map((r) => r.id));

  for (const chunk of chunks) {
    if (existingIds.has(chunk.id)) {
      // Replace existing
      const idx = index.records.findIndex((r) => r.id === chunk.id);
      if (idx !== -1) {
        index.records[idx] = chunk;
      }
    } else {
      index.records.push(chunk);
    }
  }

  writeIndex(index);
  return chunks.length;
}

/**
 * Query the local store for the top-k most similar vectors.
 */
export async function queryLocalVectors(
  embedding: number[],
  topK: number = 5
): Promise<{ id: string; content: string; score: number; metadata: Record<string, any> }[]> {
  const index = readIndex();
  if (index.records.length === 0) return [];

  const scored = index.records.map((record) => ({
    id: record.id,
    content: record.content,
    score: cosineSimilarity(embedding, record.embedding),
    metadata: record.metadata,
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

/**
 * Get the count of vectors in the local store.
 */
export async function getLocalVectorCount(): Promise<number> {
  const index = readIndex();
  return index.records.length;
}

/**
 * Delete all vectors from the local store.
 */
export async function deleteAllLocalVectors() {
  ensureDir();
  writeIndex({ records: [] });
}

/**
 * Get all unique file sources (PDF names) from the store
 */
export async function getLocalVectorSources(): Promise<string[]> {
  const index = readIndex();
  const sources = new Set<string>();
  for (const record of index.records) {
    if (record.metadata?.path) {
      sources.add(record.metadata.path);
    }
  }
  return Array.from(sources).sort();
}