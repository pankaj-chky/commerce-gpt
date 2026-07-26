import { NextResponse } from "next/server";
import { getChunkCount, getChunkSources } from "@/lib/kb/supabase-search";
import { isWebSearchAvailable } from "@/lib/search/web-search";
import { isProviderHealthy, getDegradedProviders } from "@/lib/ai/health";

export const runtime = "nodejs";
export const maxDuration = 30;

async function buildDiagnosticsReport(): Promise<Record<string, any>> {
  const report: Record<string, any> = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: {
      node_env: process.env.NODE_ENV || "not set",
      vercel_env: process.env.VERCEL_ENV || "not set (not on Vercel)",
      vercel_url: process.env.VERCEL_URL || "not set",
    },
    api_keys: {},
    llm_providers: {},
    knowledge_base: {},
    web_search: {},
  };

  // ---- API Key Presence Check ----
  const keyChecks = [
    { key: "SUPABASE_URL", name: "Supabase URL" },
    { key: "SUPABASE_SERVICE_ROLE_KEY", name: "Supabase Service Role Key" },
    { key: "GROQ_API_KEY", name: "Groq API" },
    { key: "GEMINI_API_KEY", name: "Gemini API" },
    { key: "DEEPSEEK_API_KEY", name: "DeepSeek API" },
    { key: "VOYAGEAI_API_KEY", name: "VoyageAI Embeddings" },
    { key: "TAVILY_API_KEY", name: "Tavily Search" },
    { key: "SERPER_API_KEY", name: "Serper Search" },
    { key: "FIRECRAWL_API_KEY", name: "Firecrawl Search" },
    { key: "SEARCHAPI_API_KEY", name: "SearchApi" },
    { key: "SERPAPI_API_KEY", name: "SerpApi" },
    { key: "EXA_API_KEY", name: "Exa Search" },
  ];

  for (const { key, name } of keyChecks) {
    const value = process.env[key];
    if (value) {
      // Show first few chars to verify it's set correctly
      const preview = value.length > 8 
        ? value.substring(0, 4) + "..." + value.substring(value.length - 4)
        : "***";
      report.api_keys[name] = { status: "✅ Set", preview };
    } else {
      report.api_keys[name] = { status: "❌ Not configured", preview: null };
    }
  }

  // ---- LLM Providers ----
  const llmProviders: Record<string, { envKey: string; model: string }> = {
    groq:     { envKey: "GROQ_API_KEY",     model: "llama-3.3-70b-versatile" },
    gemini:   { envKey: "GEMINI_API_KEY",   model: "gemini-2.0-flash" },
    deepseek: { envKey: "DEEPSEEK_API_KEY", model: "deepseek-chat" },
  };

  const degraded = getDegradedProviders();

  for (const [name, info] of Object.entries(llmProviders)) {
    const keySet = !!process.env[info.envKey];
    const healthy = isProviderHealthy(name);

    let status: string;
    if (!keySet) {
      status = "❌ Not configured (no API key)";
    } else if (!healthy) {
      const degInfo = degraded.find(d => d.name === name);
      const remaining = degInfo ? `${Math.ceil(degInfo.remainingCooldownMs / 1000)}s` : "unknown";
      status = `⚠ Degraded (${degInfo?.reason || "unknown"}). Retry in ${remaining}`;
    } else {
      status = "✅ Active";
    }

    report.llm_providers[name] = {
      model: info.model,
      status,
      key_configured: keySet,
      healthy,
    };
  }

  // ---- Knowledge Base ----
  try {
    report.knowledge_base = {
      total_chunks: await getChunkCount(),
      sources: await getChunkSources(),
    };
  } catch (err: any) {
    report.knowledge_base = {
      error: err.message || "Unknown error",
      note: "Common Vercel issue: Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in Vercel Environment Variables, and that the Supabase project allows connections from Vercel's IP range.",
    };
  }

  // ---- Web Search ----
  const webProviders = [
    { key: "TAVILY_API_KEY", name: "Tavily" },
    { key: "SERPER_API_KEY", name: "Serper" },
    { key: "FIRECRAWL_API_KEY", name: "Firecrawl" },
    { key: "SEARCHAPI_API_KEY", name: "SearchApi" },
    { key: "SERPAPI_API_KEY", name: "SerpApi" },
    { key: "EXA_API_KEY", name: "Exa" },
  ];
  const configured = webProviders.filter(p => !!process.env[p.key]);
  report.web_search = {
    configured_count: configured.length,
    configured_providers: configured.map(p => p.name),
    available: isWebSearchAvailable(),
  };

  // ---- Next.js Info ----
  report.nextjs = {
    runtime: "nodejs",
    maxDuration: 30,
    has_vercel_config: true,
  };

  return report;
}

export async function GET() {
  try {
    const report = await buildDiagnosticsReport();
    return NextResponse.json(report, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to build diagnostics", details: err.message || String(err) },
      { status: 500 }
    );
  }
}