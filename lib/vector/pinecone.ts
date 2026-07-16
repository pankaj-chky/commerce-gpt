import { Pinecone } from "@pinecone-database/pinecone";

let _pinecone: Pinecone | null = null;

function getPinecone(): Pinecone | null {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) return null;
  if (!_pinecone) {
    _pinecone = new Pinecone({ apiKey });
  }
  return _pinecone;
}

const PINECONE_INDEX = process.env.PINECONE_INDEX || "commerce-gpt";

export interface ChunkData {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
}

export interface ScoredChunk {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
}

export async function upsertVectors(chunks: ChunkData[]) {
  const pc = getPinecone();
  if (!pc) throw new Error("PINECONE_API_KEY is not configured");
  const index = pc.Index(PINECONE_INDEX);

  const vectors = chunks.map((chunk) => ({
    id: chunk.id,
    values: chunk.embedding,
    metadata: {
      content: chunk.content,
      ...chunk.metadata,
    },
  }));

  await index.upsert(vectors);
}

export async function queryVectors(
  embedding: number[],
  topK: number = 5
): Promise<ScoredChunk[]> {
  const pc = getPinecone();
  if (!pc) return [];
  const index = pc.Index(PINECONE_INDEX);

  const queryResponse = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
  });

  return queryResponse.matches.map((match) => ({
    id: match.id,
    content: (match.metadata?.content as string) || "",
    score: match.score || 0,
    metadata: match.metadata || {},
  }));
}

export async function deleteVectors(ids: string[]) {
  const pc = getPinecone();
  if (!pc) return;
  const index = pc.Index(PINECONE_INDEX);
  await index.deleteMany(ids);
}

export async function deleteAllInNamespace(_namespace?: string) {
  const pc = getPinecone();
  if (!pc) return;
  const index = pc.Index(PINECONE_INDEX);
  await index.deleteAll();
}
