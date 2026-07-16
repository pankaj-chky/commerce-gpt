import { createDeepSeek } from "@ai-sdk/deepseek";
import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import {
  isProviderHealthy,
  degradeProvider,
  shouldDegradeProvider,
} from "@/lib/ai/health";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

let _deepseekProvider: ReturnType<typeof createDeepSeek> | null = null;
let _groqProvider: ReturnType<typeof createGroq> | null = null;
let _googleProvider: ReturnType<typeof createGoogleGenerativeAI> | null = null;

function getDeepseekProvider() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;
  if (!_deepseekProvider) {
    _deepseekProvider = createDeepSeek({ apiKey });
  }
  return _deepseekProvider;
}

function getGroqProvider() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  if (!_groqProvider) {
    _groqProvider = createGroq({ apiKey });
  }
  return _groqProvider;
}

function getGoogleProvider() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!_googleProvider) {
    _googleProvider = createGoogleGenerativeAI({ apiKey });
  }
  return _googleProvider;
}

/**
 * Converts an AsyncIterable<string> to a ReadableStream<Uint8Array>.
 */
function asyncIterableToReadableStream(
  iterable: AsyncIterable<string>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const iterator = iterable[Symbol.asyncIterator]();

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(encoder.encode(value));
      }
    },
    cancel() {
      iterator.return?.();
    },
  });
}

/**
 * Try to call a specific provider. On failure, classify the error and
 * degrade the provider if it's a permanent/long-lived error (402, 429, etc.).
 */
async function tryProvider(
  name: string,
  providerFn: () => Promise<ReadableStream<Uint8Array>>
): Promise<ReadableStream<Uint8Array> | null> {
  try {
    const stream = await providerFn();
    return stream;
  } catch (err: any) {
    // Extract status and body from AI SDK error
    const status = err?.statusCode ?? err?.status ?? undefined;
    const body =
      err?.responseBody ??
      (typeof err?.message === "string" ? err.message : "") ??
      "";

    const { degrade, reason } = shouldDegradeProvider(status, body);
    if (degrade) {
      degradeProvider(name, reason);
    } else {
      // Non-degrading error (e.g., transient network issue) — just log
      console.warn(
        `[LLM Router] Provider "${name}" transient error: ${(err as Error).message?.slice(0, 200)}`
      );
    }
    return null; // Fall through to next provider
  }
}

// Provider configurations with health-aware guards
interface ProviderEntry {
  name: string;
  getProvider: () => any;
  model: string;
}

const LLM_PROVIDERS: ProviderEntry[] = [
  { name: "groq", getProvider: getGroqProvider, model: "llama-3.3-70b-versatile" },
  { name: "gemini", getProvider: getGoogleProvider, model: "gemini-2.0-flash" },
  { name: "deepseek", getProvider: getDeepseekProvider, model: "deepseek-chat" },
];

export async function routeToLLM(
  messages: LLMMessage[]
): Promise<ReadableStream<Uint8Array>> {
  // Separate system messages from user/assistant messages.
  // AI SDK v7 requires system instructions to be passed via the `system`
  // parameter, not in the messages array (this is enforced by Gemini).
  const systemMsgs = messages.filter((m) => m.role === "system");
  const chatMsgs = messages.filter((m) => m.role !== "system");

  const mappedMessages = chatMsgs.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));

  const systemPrompt = systemMsgs.map((m) => m.content).join("\n\n") || undefined;

  const commonOptions = {
    messages: mappedMessages,
    system: systemPrompt,
    temperature: 0.7,
    maxOutputTokens: 4096,
  };

  // Iterate providers: skip unhealthy ones, try each in order
  for (const { name, getProvider, model } of LLM_PROVIDERS) {
    if (!isProviderHealthy(name)) {
      console.log(`[LLM Router] Skipping "${name}" — currently degraded`);
      continue;
    }

    const provider = getProvider();
    if (!provider) continue;

    const stream = await tryProvider(name, async () => {
      const result = await streamText({
        ...commonOptions,
        model: provider(model),
      });
      return asyncIterableToReadableStream(result.textStream);
    });

    if (stream) return stream;
  }

  throw new Error(
    "No AI provider is available. Set DEEPSEEK_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY."
  );
}