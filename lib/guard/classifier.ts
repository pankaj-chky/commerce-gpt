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
 * Pre-check for common greetings and casual phrases that should be treated as COMMERCE.
 */
function isGreetingOrCasual(query: string): boolean {
  const lower = query.toLowerCase().trim();
  const greetings = [
    /^(hi|hello|hey|heyy|heyo|sup|yo|hii|hiiii)([.!?\s]*)$/i,
    /^(good\s*(morning|afternoon|evening|day|night))(.*)$/i,
    /^(what'?s\s*up|howdy|wassup|wassap)(.*)$/i,
    /^(how\s+(are|r)\s+you|how('s|s)\s+(it\s+going|life|everything|things))(.*)$/i,
    /^(nice\s+to\s+meet|pleased\s+to\s+meet)(.*)$/i,
    /^(thanks|thank\s+you|ty|thx|thanx)([.!?\s]*)$/i,
    /^(ok|okay|k|kk|alright|sure|fine)([.!?\s]*)$/i,
    /^(bye|goodbye|cya|see\s+ya|later|gotta\s+go)(.*)$/i,
  ];
  return greetings.some((pattern) => pattern.test(lower));
}

/**
 * Check if the query is asking about who created/made the AI.
 */
export function isCreatorQuery(query: string): boolean {
  const lower = query.toLowerCase().trim();
  const creatorPatterns = [
    // Common variants (including shorthand: u=you, ur=your, whos=who's)
    /who\s+(made|created|built|developed|programmed|coded|designed|invented)\s+(you|u|this|this\s+ai|this\s+bot|this\s+assistant)/i,
    /who('s| is|s)\s+(your|ur)\s+(creator|maker|developer|builder|programmer|owner|master|author)/i,
    /what('s| is|s)\s+(your|ur)\s+(creator'?s?|maker'?s?|developer'?s?)\s+name/i,

    // Short/noisy variants (with u/you support)
    /who\s+made\s+(you|u)/i,
    /who\s+created\s+(you|u)/i,
    /who\s+built\s+(you|u)/i,
    /who\s+developed\s+(you|u)/i,
    /who\s+made\s+this\s+ai/i,
    /who\s+created\s+this\s+ai/i,

    // User wrote "who is pankaj" / "who is Pankaj" etc.
    /who\s+is\s+the\s+creator/i,
    /who('s| is|s)\s+(your|ur)\s+creator/i,
    /who\s+is\s+(your|ur)\s+(owner|master)/i,

    // Explicit Pankaj references
    /who\s+is\s+pankaj\b/i,
    /who\s+is\s+pankaj\s+chakraborty\b/i,
    /pankaj\s+chakraborty\s+made\s+(you|u|this)/i,
    /tell\s+me\s+about\s+pankaj\b/i,
    /tell\s+(me|us)\s+about\s+pankaj\s+chakraborty\b/i,
    /what\s+(do\s+(you|u)\s+know\s+about|about)\s+pankaj\b/i,
    /what\s+(do\s+(you|u)\s+know\s+about|about)\s+pankaj\s+chakraborty\b/i,
    /pankaj\s+chakraborty/i,

    // Setup/context variants
    /tell\s+me\s+about\s+(your|ur)\s+(creator|maker|developer)/i,
    /who\s+do\s+i\s+thank\s+for\s+(making|creating|building)\s+(you|u)/i,
    /who\s+developed\s+(you|u|this)/i,
    /who\s+built\s+(you|u|this)/i,
    /who\s+made\s+(you|u|this\s+app|this\s+website|this\s+project)/i,
    /who\s+created\s+(you|u|this\s+app|this\s+website|this\s+project)/i,
    /who\s+owns\s+(you|u)/i,
    /who('s| is|s)\s+(your|ur)\s+owner/i,
    /who\s+is\s+the\s+man\s+behind\s+(you|u|this)/i,
  ];
  return creatorPatterns.some((pattern) => pattern.test(lower));
}

/**
 * Check if the query is about Pankaj Chakraborty but with additional context
 * (e.g., "who is Pankaj Chakraborty, scientist?" or "who is Pankaj Chakraborty, doctor?").
 * Returns true if there's extra context beyond just asking about who Pankaj is.
 * This allows the classifier to decide whether the query is commerce-related
 * (e.g., "who is Pankaj Chakraborty, commerce professor?") or unrelated.
 */
export function isPankajWithContext(query: string): boolean {
  const lower = query.toLowerCase().trim();
  // Check if the query includes "who is pankaj [something]" or "who is pankaj chakraborty [something]"
  // where [something] is additional context beyond the name
  const pankajWithExtra = /who\s+is\s+pankaj(\s+chakraborty)?\s+\w/i.test(lower);
  // Also check for "tell me about pankaj [something]" or "what do you know about pankaj [something]"
  const tellWithExtra = /tell\s+me\s+about\s+pankaj(\s+chakraborty)?\s+\w/i.test(lower);
  const knowWithExtra = /what\s+(do\s+you\s+know\s+about|about)\s+pankaj(\s+chakraborty)?\s+\w/i.test(lower);
  // Check for "pankaj chakraborty [profession/role]" with a word after the name
  const pankajRole = /pankaj\s+chakraborty\s+\w/i.test(lower) && !/pankaj\s+chakraborty\s+(made|created|built|developed|programmed|coded|designed|invented)\s/i.test(lower);
  
  return pankajWithExtra || tellWithExtra || knowWithExtra || pankajRole;
}

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
  // Pre-check: greetings and casual phrases should always pass through
  if (isGreetingOrCasual(query)) {
    return "COMMERCE";
  }

  const systemPrompt = `You are a domain classifier for a commerce education assistant. 
Your task is to determine if a user's query is related to commerce, accounting, finance, 
taxation, economics, business law, or business studies.

Greetings, casual conversation, and questions about the assistant itself (who made you, etc.) 
should be classified as COMMERCE since they are part of normal interaction.

Respond with exactly one word: "COMMERCE" if the query is related to these topics or is general interaction, 
or "UNRELATED" if it is clearly not. Do not include any other text.`;

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