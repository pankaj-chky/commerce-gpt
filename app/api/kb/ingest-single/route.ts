import { NextRequest, NextResponse } from "next/server";
import { storeChunks, deleteChunksByFilename } from "@/lib/kb/supabase-search";
import {
  PartitionResult,
  partitionDocument,
} from "@/lib/unstructured/client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { fileBase64, filename, bucket } = body;

    if (!fileBase64 || !filename) {
      return NextResponse.json(
        { error: "fileBase64 and filename are required" },
        { status: 400 }
      );
    }

    // Partition PDF via Unstructured
    const partition: PartitionResult = await partitionDocument({
      contentType: "application/pdf",
      strategy: "fast",
      includePageBreaks: false,
      fileBase64,
      filename,
    } as any);

    const elements = partition.elements ?? [];
    const texts = elements
      .map((el: any) => el.text)
      .filter((t: unknown): t is string => typeof t === "string" && t.trim().length > 0);

    if (texts.length === 0) {
      return NextResponse.json({
        ok: true,
        ingestedChunks: 0,
        message: "No text extracted from PDF",
      });
    }

    // Delete old chunks for this file (supports re-ingestion)
    await deleteChunksByFilename(filename);

    // Store chunks directly in Supabase (no embeddings needed)
    const chunks = texts.map((t: string, i: number) => ({
      content: t,
      filename,
      bucket: bucket || "default",
      chunkIndex: i,
    }));

    const stored = await storeChunks(chunks);

    return NextResponse.json({
      ok: true,
      ingestedChunks: stored,
      filename,
      message: `Stored ${stored} chunks in Supabase`,
    });
  } catch (e: any) {
    console.error("KB ingest-single error:", e);
    return NextResponse.json(
      { error: e?.message ?? "KB ingest-single failed" },
      { status: 500 }
    );
  }
}