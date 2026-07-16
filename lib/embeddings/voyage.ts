import { OpenAI } from "openai";

let _voyageClient: OpenAI | null = null;

function getVoyageClient(): OpenAI | null {
  const apiKey = process.env.VOYAGEAI_API_KEY;
  if (!apiKey) return null;
  if (!_voyageClient) {
    _voyageClient = new OpenAI({
      apiKey,
      baseURL: "https://api.voyageai.com/v1",
    });
  }
  return _voyageClient;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getVoyageClient();
  if (!client) throw new Error("VOYAGEAI_API_KEY is not configured");
  const response = await client.embeddings.create({
    model: "voyage-2",
    input: text,
  });

  return response.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const client = getVoyageClient();
  if (!client) throw new Error("VOYAGEAI_API_KEY is not configured");
  const response = await client.embeddings.create({
    model: "voyage-2",
    input: texts,
  });

  return response.data.map((item) => item.embedding);
}
