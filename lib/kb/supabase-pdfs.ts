import { getSupabaseServerClient } from "@/lib/supabase/client";
import {
  PartitionResult,
  partitionDocument,
} from "@/lib/unstructured/client";
import { upsertVectors } from "@/lib/vector/pinecone";
import { upsertLocalVectors } from "@/lib/vector/local-store";
import { generateEmbeddings } from "@/lib/embeddings/voyage";

export interface SupabasePdfIngestOptions {
  bucket: string;
  prefix?: string;
  /** Only ingest files ending with .pdf */
  fileSuffix?: string;
  /** Unstructured partitioning strategy */
  strategy?: "auto" | "fast" | "hi_res" | "ocr_only";
}

/**
 * Lists PDF objects from Supabase Storage and ingests their extracted text into Pinecone.
 *
 * Notes:
 * - Uses Unstructured to parse/partition documents.
 * - Uses Voyage embeddings to create vectors.
 * - Uses downloaded PDF bytes converted to base64.
 */
export async function ingestSupabasePdfsToPinecone(
  opts: SupabasePdfIngestOptions
) {
  const bucket = opts.bucket;
  const prefix = opts.prefix ?? "";
  const fileSuffix = opts.fileSuffix ?? ".pdf";
  const strategy = opts.strategy ?? "auto";

  const supabase = getSupabaseServerClient();

  // Collect PDF object paths under prefix.
  let pageOffset = 0;
  const limit = 1000;
  const allPdfPaths: string[] = [];

  while (true) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit, offset: pageOffset });

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const item of data as any[]) {
      const name = item?.name as string | undefined;
      if (!name) continue;

      const fullPath = prefix ? `${prefix}/${name}` : name;

      // Only ingest PDFs directly returned by this list call.
      if (name.endsWith(fileSuffix)) {
        allPdfPaths.push(fullPath);
      }
    }

    pageOffset += limit;
    if (data.length < limit) break;
  }

  if (allPdfPaths.length === 0) {
    return { ingestedChunks: 0, ingestedFiles: 0, paths: [] as string[] };
  }

  let ingestedChunks = 0;
  let ingestedFiles = 0;

  for (const path of allPdfPaths) {
    // Download PDF bytes
    const { data: dlData, error: dlErr } = await supabase.storage
      .from(bucket)
      .download(path);

    if (dlErr) throw dlErr;
    if (!dlData) continue;

    const arrayBuffer = await dlData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const fileBase64 = Buffer.from(bytes).toString("base64");

    // Partition PDF via Unstructured using base64 mode.
    // partitionDocument supports a custom "fileBase64" field (added in next step).
    const partition: PartitionResult = await partitionDocument({
      contentType: "application/pdf",
      strategy,
      includePageBreaks: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fileBase64,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filename: path.split("/").pop(),
    } as any);

    const elements = partition.elements ?? [];
    const texts = elements
      .map((el) => el.text)
      .filter((t) => typeof t === "string" && t.trim().length > 0);

    if (texts.length === 0) continue;

    const embeddings = await generateEmbeddings(texts);

    const vectors = texts.map((t, i) => ({
      id: `supabase:${bucket}:${path}:chunk:${i}`,
      embedding: embeddings[i],
      content: t,
      metadata: {
        source: "supabase-storage",
        bucket,
        path,
        chunkIndex: i,
      },
    }));

    const mappedVectors = vectors.map((v) => ({
      id: v.id,
      content: v.content,
      embedding: v.embedding,
      metadata: v.metadata,
    }));

    // Try Pinecone (cloud)
    try {
      await upsertVectors(mappedVectors);
    } catch {
      // Pinecone not configured — skip
    }

    // Always store in local vector store
    await upsertLocalVectors(mappedVectors);

    ingestedChunks += vectors.length;
    ingestedFiles += 1;
  }

  return { ingestedChunks, ingestedFiles, paths: allPdfPaths };
}
