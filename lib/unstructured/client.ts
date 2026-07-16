/**
 * Unstructured API Client — for parsing and chunking documents.
 * API docs: https://docs.unstructured.io/api-reference
 */
const UNSTRUCTURED_BASE = "https://api.unstructuredapp.io/general/v0/general";

function getApiKey(): string | null {
  return process.env.UNSTRUCTURED_API_KEY || null;
}

function getAuthHeader(apiKey: string): string {
  const basic = Buffer.from(`${apiKey}:`).toString("base64");
  return `Basic ${basic}`;
}

export interface PartitionParams {
  /** URL of the file to partition */
  url?: string;
  /** Raw file content as string (for text-based files) */
  content?: string;
  /** Content type hint (e.g., "text/html", "application/pdf") */
  contentType?: string;
  /** Strategy for partitioning: "auto", "fast", "hi_res", "ocr_only" */
  strategy?: "auto" | "fast" | "hi_res" | "ocr_only";
  /** Include page breaks in output */
  includePageBreaks?: boolean;
  /** Maximum number of characters per chunk */
  maxCharacters?: number;
  /** Overlap between chunks */
  overlap?: number;
}

export interface PartitionResult {
  elements: PartitionElement[];
}

export interface PartitionElement {
  type: string;
  element_id: string;
  text: string;
  metadata: {
    filename?: string;
    filetype?: string;
    languages?: string[];
    page_number?: number;
    [key: string]: unknown;
  };
}

export async function partitionDocument(
  params: PartitionParams
): Promise<PartitionResult> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("UNSTRUCTURED_API_KEY is not configured");

  const body: Record<string, unknown> = {
    strategy: params.strategy || "auto",
    include_page_breaks: params.includePageBreaks ?? false,
  };

  if (params.url) {
    // Partition a file from a URL
    return partitionUrl(apiKey, params.url, body);
  }

  if (params.content) {
    body.text = params.content;
    if (params.contentType) {
      body.content_type = params.contentType;
    }
  }

  if (params.maxCharacters) body.max_characters = params.maxCharacters;
  if (params.overlap) body.overlap = params.overlap;

  const res = await fetch(`${UNSTRUCTURED_BASE}`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(apiKey),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Unstructured API error ${res.status}: ${errBody.slice(0, 200)}`);
  }

  const data = await res.json();
  return { elements: Array.isArray(data) ? data : [] };
}

async function partitionUrl(
  apiKey: string,
  url: string,
  baseBody: Record<string, unknown>
): Promise<PartitionResult> {
  // First download the file, then partition
  const downloadRes = await fetch(url);
  if (!downloadRes.ok) {
    throw new Error(`Failed to download file from URL: ${downloadRes.status}`);
  }

  const contentType =
    downloadRes.headers.get("content-type") || "application/octet-stream";
  const buffer = await downloadRes.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const body = {
    ...baseBody,
    file: base64,
    content_type: contentType,
  };

  const res = await fetch(`${UNSTRUCTURED_BASE}`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(apiKey),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Unstructured API error ${res.status}: ${errBody.slice(0, 200)}`);
  }

  const data = await res.json();
  return { elements: Array.isArray(data) ? data : [] };
}

/**
 * Partition plain text content into structured elements.
 */
export async function partitionText(
  text: string,
  options?: { strategy?: PartitionParams["strategy"]; maxCharacters?: number }
): Promise<PartitionResult> {
  return partitionDocument({
    content: text,
    contentType: "text/plain",
    ...options,
  });
}

/**
 * Check if the Unstructured API is configured and reachable.
 */
export async function isUnstructuredAvailable(): Promise<boolean> {
  const apiKey = getApiKey();
  if (!apiKey) return false;
  try {
    const res = await fetch(`${UNSTRUCTURED_BASE}`, {
      method: "GET",
      headers: {
        Authorization: getAuthHeader(apiKey),
        Accept: "application/json",
      },
    });
    return res.status !== 401 && res.status !== 403;
  } catch {
    return false;
  }
}