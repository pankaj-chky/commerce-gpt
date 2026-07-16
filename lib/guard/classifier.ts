import OpenAI from "openai";
import { isProviderHealthy, degradeProvider, shouldDegradeProvider } from "@/lib/ai/health";

let _deepseekClient: OpenAI | null = null;
let _groqClient: OpenAI | null = null;
let _geminiClient: OpenAI | null = null;

function getDeepseekClient(): OpenAI | null {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;
  if (!_deepseekClient) {
    _deepseekClient = new OpenAI({
      apiKey,
      baseURL: "https://api.deepseek.com/v1",
    });
  }
  return _deepseekClient;
}

function getGroqClient(): OpenAI | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  if (!_groqClient) {
    _groqClient = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return _groqClient;
}

function getGeminiClient(): OpenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!_geminiClient) {
    _geminiClient = new OpenAI({
      apiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
  }
  return _geminiClient;
}

type ClassificationResult = "COMMERCE" | "UNRELATED";

/**
 * Try classification with a specific provider.
 * Returns null if the provider fails; on permanent errors (402, 429),
 * degrades the provider so it's skipped in future calls.
 */
async function tryClassifyWithProvider(
  providerName: string,
  getClient: () => OpenAI | null,
  model: string,
  systemPrompt: string,
  query: string
): Promise<ClassificationResult | null> {
  if (!isProviderHealthy(providerName)) return null;

  const client = getClient();
  if (!client) return null;

  try {
    return await classifyWithClient(client, model, systemPrompt, query);
  } catch (err: any) {
    const status = err?.statusCode ?? err?.status ?? undefined;
    const body =
      err?.responseBody ??
      (typeof err?.message === "string" ? err.message : "") ??
      "";

    const { degrade, reason } = shouldDegradeProvider(status, body);
    if (degrade) {
      degradeProvider(providerName, reason);
    }
    return null;
  }
}

export async function classifyQuery(query: string): Promise<ClassificationResult> {
  const systemPrompt = `You are a domain classifier for a commerce education assistant. 
Your task is to determine if a user's query is related to commerce, accounting, finance, 
taxation, economics, business law, or business studies.

Respond with exactly one word: "COMMERCE" if the query is related to these topics, 
or "UNRELATED" if it is not. Do not include any other text.`;

  // Try Groq first (fastest)
  const groqResult = await tryClassifyWithProvider(
    "groq",
    getGroqClient,
    "llama-3.3-70b-versatile",
    systemPrompt,
    query
  );
  if (groqResult) return groqResult;

  // Try Gemini
  const geminiResult = await tryClassifyWithProvider(
    "gemini",
    getGeminiClient,
    "gemini-2.0-flash",
    systemPrompt,
    query
  );
  if (geminiResult) return geminiResult;

  // Try DeepSeek
  const deepseekResult = await tryClassifyWithProvider(
    "deepseek",
    getDeepseekClient,
    "deepseek-chat",
    systemPrompt,
    query
  );
  if (deepseekResult) return deepseekResult;

  // If all fail or are not configured, default to COMMERCE
  return "COMMERCE";
}

async function classifyWithClient(
  client: OpenAI,
  model: string,
  systemPrompt: string,
  query: string
): Promise<ClassificationResult | null> {
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: query },
    ],
    temperature: 0.1,
    max_tokens: 10,
  });

  const result = response.choices[0]?.message?.content?.trim().toUpperCase();

  if (result === "COMMERCE" || result === "UNRELATED") {
    return result;
  }

  return null;
}