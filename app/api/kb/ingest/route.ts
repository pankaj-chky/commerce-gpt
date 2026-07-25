import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import { storeChunks, deleteChunksByFilename } from "@/lib/kb/supabase-search";
import {
  PartitionResult,
  partitionDocument,
} from "@/lib/unstructured/client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));

    const bucket =
      body.bucket ?? (process.env.SUPABASE_STORAGE_BUCKET as string | undefined);
    const prefix = body.prefix ?? "";

    if (!bucket || typeof bucket !== "string") {
      return NextResponse.json(
        {
          error:
            "Missing bucket. Provide {bucket} or set SUPABASE_STORAGE_BUCKET.",
        },
        { status: 400 }
      );
    }

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
        if (name.endsWith(".pdf")) {
          allPdfPaths.push(fullPath);
        }
      }

      pageOffset += limit;
      if (data.length < limit) break;
    }

    if (allPdfPaths.length === 0) {
      return NextResponse.json({
        ok: true,
        ingestedChunks: 0,
        ingestedFiles: 0,
        paths: [] as string[],
      });
    }

    let ingestedChunks = 0;
    let ingestedFiles = 0;

    for (const path of allPdfPaths) {
      // Download PDF bytes
      const { data: dlData, error: dlErr } = await supabase.storage
        .from(bucket)
        .download(path);

      if (dlErr || !dlData) {
        console.error(`[Ingest] Download failed for ${path}:`, dlErr?.message);
        continue;
      }

      const arrayBuffer = await dlData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const fileBase64 = Buffer.from(bytes).toString("base64");
      const filename = path.split("/").pop() || path;

      // Partition PDF via Unstructured
      const partition: PartitionResult = await partitionDocument({
        contentType: "application/pdf",
        strategy: body.strategy || "auto",
        includePageBreaks: false,
        fileBase64,
        filename,
      } as any);

      const elements = partition.elements ?? [];
      const texts = elements
        .map((el) => el.text)
        .filter((t) => typeof t === "string" && t.trim().length > 0);

      if (texts.length === 0) continue;

      // Delete old chunks for this file (re-ingestion support)
      await deleteChunksByFilename(filename);

      // Store chunks in Supabase
      const chunks = texts.map((t, i) => ({
        content: t,
        filename,
        bucket,
        chunkIndex: i,
      }));

      await storeChunks(chunks);
      ingestedChunks += chunks.length;
      ingestedFiles += 1;
    }

    return NextResponse.json({
      ok: true,
      ingestedChunks,
      ingestedFiles,
      paths: allPdfPaths,
    });
  } catch (e: any) {
    console.error("KB ingest error:", e);
    return NextResponse.json(
      { error: e?.message ?? "KB ingest failed" },
      { status: 500 }
    );
  }
}