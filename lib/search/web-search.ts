/**
 * Web Search Module — cascading fallback across multiple search APIs.
 * When vector search returns no results, this module is used to find
 * relevant information from the web.
 *
 * Now health-aware: providers that return rate-limit or auth errors
 * are temporarily skipped for subsequent calls.
 */

import { isProviderHealthy, degradeProvider, shouldDegradeProvider } from "@/lib/ai/health";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  /** Full content if available (e.g., from Tavily or Firecrawl) */
  content?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  provider: string;
}

// ---- Provider Implementations ----

async function searchTavily(query: string, apiKey: string): Promise<SearchResponse> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      search_depth: "advanced",
      max_results: 5,
      include_answer: true,
      include_raw_content: false,
    }),
  });

  if (!res.ok) throw new Error(`Tavily HTTP ${res.status}`);

  const data = await res.json();
  const results: SearchResult[] = [];

  // Tavily returns an "answer" field with a synthesized answer
  if (data.answer) {
    results.push({
      title: "AI Summary",
      url: "",
      snippet: data.answer,
      content: data.answer,
    });
  }

  for (const r of data.results || []) {
    results.push({
      title: r.title || "",
      url: r.url || "",
      snippet: r.content || r.snippet || "",
      content: r.content || "",
    });
  }

  return { results, provider: "Tavily" };
}

async function searchSerper(query: string, apiKey: string): Promise<SearchResponse> {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: 5 }),
  });

  if (!res.ok) throw new Error(`Serper HTTP ${res.status}`);

  const data = await res.json();
  const results: SearchResult[] = [];

  for (const r of data.organic || []) {
    results.push({
      title: r.title || "",
      url: r.link || "",
      snippet: r.snippet || "",
    });
  }

  return { results, provider: "Serper" };
}

async function searchExa(query: string, apiKey: string): Promise<SearchResponse> {
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, numResults: 5, contents: { text: true } }),
  });

  if (!res.ok) throw new Error(`Exa HTTP ${res.status}`);

  const data = await res.json();
  const results: SearchResult[] = [];

  for (const r of data.results || []) {
    results.push({
      title: r.title || "",
      url: r.url || "",
      snippet: r.text || r.snippet || "",
      content: r.text || "",
    });
  }

  return { results, provider: "Exa" };
}

async function searchFirecrawl(query: string, apiKey: string): Promise<SearchResponse> {
  // Firecrawl search endpoint
  const res = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      limit: 5,
      scrapeOptions: { formats: ["markdown"] },
    }),
  });

  if (!res.ok) throw new Error(`Firecrawl HTTP ${res.status}`);

  const data = await res.json();
  const results: SearchResult[] = [];

  // Firecrawl returns data in different shapes; handle both
  const items = data.data || data.results || [];
  for (const r of items) {
    results.push({
      title: r.title || r.metadata?.title || "",
      url: r.url || r.metadata?.sourceURL || "",
      snippet: r.markdown || r.content || r.description || "",
      content: r.markdown || r.content || "",
    });
  }

  return { results, provider: "Firecrawl" };
}

async function searchSearchApi(query: string, apiKey: string): Promise<SearchResponse> {
  const res = await fetch(
    `https://www.searchapi.io/api/v1/search?api_key=${encodeURIComponent(apiKey)}&engine=google&q=${encodeURIComponent(query)}&num=5`
  );

  if (!res.ok) throw new Error(`SearchApi HTTP ${res.status}`);

  const data = await res.json();
  const results: SearchResult[] = [];

  for (const r of data.organic_results || []) {
    results.push({
      title: r.title || "",
      url: r.link || "",
      snippet: r.snippet || "",
    });
  }

  return { results, provider: "SearchApi" };
}

async function searchSerpApi(query: string, apiKey: string): Promise<SearchResponse> {
  const res = await fetch(
    `https://serpapi.com/search?api_key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}&engine=google&num=5`
  );

  if (!res.ok) throw new Error(`SerpApi HTTP ${res.status}`);

  const data = await res.json();
  const results: SearchResult[] = [];

  for (const r of data.organic_results || []) {
    results.push({
      title: r.title || "",
      url: r.link || "",
      snippet: r.snippet || "",
    });
  }

  return { results, provider: "SerpApi" };
}

// ---- Search Provider Registry ----

interface SearchProvider {
  name: string;
  envKey: string;
  search: (query: string, apiKey: string) => Promise<SearchResponse>;
}

const SEARCH_PROVIDERS: SearchProvider[] = [
  { name: "Tavily", envKey: "TAVILY_API_KEY", search: searchTavily },
  { name: "Serper", envKey: "SERPER_API_KEY", search: searchSerper },
  { name: "Firecrawl", envKey: "FIRECRAWL_API_KEY", search: searchFirecrawl },
  { name: "SearchApi", envKey: "SEARCHAPI_API_KEY", search: searchSearchApi },
  { name: "SerpApi", envKey: "SERPAPI_API_KEY", search: searchSerpApi },
  { name: "Exa", envKey: "EXA_API_KEY", search: searchExa },
];

// ---- Public API ----

/**
 * Perform a web search with cascading fallback across all configured providers.
 * Tries each provider in order; if one fails or returns no results, falls through to the next.
 *
 * @param query - The search query string
 * @returns SearchResponse with results and the provider name, or null if all fail
 */
export async function searchWeb(query: string): Promise<SearchResponse | null> {
  for (const provider of SEARCH_PROVIDERS) {
    // Skip providers that have been marked as degraded
    if (!isProviderHealthy(provider.name.toLowerCase())) {
      console.log(`[Search] Skipping "${provider.name}" — currently degraded`);
      continue;
    }

    const apiKey = process.env[provider.envKey];
    if (!apiKey) continue;

    try {
      const response = await provider.search(query, apiKey);
      if (response.results.length > 0) {
        return response;
      }
      // Provider returned empty results — try next
    } catch (err: any) {
      // Classify the error and degrade if permanent (402, 429, 401, 403)
      const status = err?.statusCode ?? err?.status ?? undefined;
      const body =
        err?.responseBody ??
        (typeof err?.message === "string" ? err.message : "") ??
        "";

      const { degrade, reason } = shouldDegradeProvider(status, body);
      if (degrade) {
        degradeProvider(provider.name.toLowerCase(), reason);
      }
      // Fall through to next provider
    }
  }

  return null;
}

/**
 * Search the web and format results as a context string for the LLM.
 */
export async function searchWebAsContext(query: string): Promise<string | null> {
  const result = await searchWeb(query);
  if (!result || result.results.length === 0) return null;

  const formatted = result.results
    .map((r, i) => {
      let entry = `[${i + 1}] ${r.title}`;
      if (r.url) entry += `\n    URL: ${r.url}`;
      const text = r.content || r.snippet;
      if (text) entry += `\n    ${text.slice(0, 500)}`;
      return entry;
    })
    .join("\n\n");

  return `Web search results (via ${result.provider}):\n\n${formatted}`;
}

/**
 * Check if any search API is configured.
 */
export function isWebSearchAvailable(): boolean {
  return SEARCH_PROVIDERS.some((p) => !!process.env[p.envKey]);
}

export { SEARCH_PROVIDERS };