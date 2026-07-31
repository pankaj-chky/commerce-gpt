import { NextRequest, NextResponse } from "next/server";
import { classifyQuery, isCreatorQuery, isPankajWithContext } from "@/lib/guard/classifier";
import { searchChunks, getChunkCount, getChunkSources } from "@/lib/kb/supabase-search";
import { searchWebAsContext, isWebSearchAvailable } from "@/lib/search/web-search";
import { routeToLLM, LLMMessage } from "@/lib/ai/router";
import {
  isProviderHealthy,
  getDegradedProviders,
} from "@/lib/ai/health";

export const runtime = "nodejs";
export const maxDuration = 30;

/** ---- Diagnostics Report Builder ---- */
async function buildDiagnosticsReport(): Promise<string> {
  const lines: string[] = [];

  lines.push("🔧 **Commerce GPT — System Diagnostics**");
  lines.push("");

  // Uptime
  const uptime = process.uptime();
  const mins = Math.floor(uptime / 60);
  const secs = Math.floor(uptime % 60);
  lines.push(`**Uptime:** ${mins}m ${secs}s`);
  lines.push(`**Server Time:** ${new Date().toLocaleString()}`);

  // ---- LLM Providers ----
  const llmProviders: Record<string, { envKey: string; model: string }> = {
    groq:     { envKey: "GROQ_API_KEY",     model: "llama-3.3-70b-versatile" },
    gemini:   { envKey: "GEMINI_API_KEY",   model: "gemini-2.0-flash" },
    deepseek: { envKey: "DEEPSEEK_API_KEY", model: "deepseek-chat" },
  };

  lines.push("");
  lines.push("---");
  lines.push("**🤖 LLM Providers:**");
  lines.push("");

  const degraded = getDegradedProviders();
  let activeProvider: string | null = null;

  for (const [name, info] of Object.entries(llmProviders)) {
    const keySet = !!process.env[info.envKey];
    const healthy = isProviderHealthy(name);

    let status: string;
    if (!keySet) {
      status = "❌ Not configured";
    } else if (!healthy) {
      const degInfo = degraded.find(d => d.name === name);
      const remaining = degInfo ? `${Math.ceil(degInfo.remainingCooldownMs / 1000)}s` : "unknown";
      status = `⚠ Degraded (${degInfo?.reason || "unknown"}). Retry in ${remaining}`;
    } else {
      status = "✅ Active";
      if (!activeProvider) activeProvider = `${name} / ${info.model}`;
    }

    lines.push(`- **${name}** (${info.model}): ${status}`);
  }

  if (activeProvider) {
    lines.push("");
    lines.push(`🎯 **Active Model:** ${activeProvider}`);
  } else {
    lines.push("");
    lines.push("⚠ **No LLM provider is currently available.**");
  }

  // ---- Knowledge Base ----
  lines.push("");
  lines.push("---");
  lines.push("**📚 Knowledge Base (Supabase):**");
  lines.push("");

  try {
    const chunkCount = await getChunkCount();
    const sources = await getChunkSources();
    lines.push(`- **Total Chunks:** ${chunkCount.toLocaleString()}`);
    lines.push(`- **Unique PDFs:** ${sources.length}`);

    if (sources.length > 0) {
      lines.push("");
      lines.push("**Ingested PDFs:**");
      const preview = sources.slice(0, 15);
      preview.forEach((s) => lines.push(`  • ${s}`));
      const remaining = sources.length - 15;
      if (remaining > 0) lines.push(`  ...and ${remaining} more`);
    } else {
      lines.push("⚠ No PDFs ingested yet.");
    }
  } catch {
    lines.push("⚠ Could not query Knowledge Base.");
  }

  // ---- Web Search ----
  lines.push("");
  lines.push("---");
  lines.push("**🌐 Web Search Fallback:**");
  lines.push("");

  const webProviders = [
    { key: "TAVILY_API_KEY", name: "Tavily" },
    { key: "SERPER_API_KEY", name: "Serper" },
    { key: "FIRECRAWL_API_KEY", name: "Firecrawl" },
    { key: "SEARCHAPI_API_KEY", name: "SearchApi" },
    { key: "SERPAPI_API_KEY", name: "SerpApi" },
    { key: "EXA_API_KEY", name: "Exa" },
  ];
  const configured = webProviders.filter(p => !!process.env[p.key]);
  const webAvailable = isWebSearchAvailable();
  lines.push(`- **Configured:** ${configured.length} (${configured.map(p => p.name).join(", ") || "none"})`);
  lines.push(`- **Status:** ${webAvailable ? "✅ Available" : "⚠ Not available"}`);

  // ---- Embeddings ----
  lines.push("");
  lines.push("---");
  lines.push("**🧮 Embeddings:**");
  lines.push("");
  lines.push(`- **VoyageAI:** ${process.env.VOYAGEAI_API_KEY ? "✅ Key set" : "⚠ Not configured"}`);
  lines.push(`- **Unstructured:** ${process.env.UNSTRUCTURED_API_KEY ? "✅ Key set" : "⚠ Not configured"}`);

  // ---- Notes ----
  lines.push("");
  lines.push("---");
  lines.push("**ℹ Info:**");
  lines.push("- KB search: Supabase ILIKE → Web fallback");
  lines.push("- Providers auto-degrade on 401/402/403/429 (cooldown: 5 min)");
  lines.push(`- ${degraded.length > 0 ? `⚠ ${degraded.length} provider(s) degraded` : "✅ All providers healthy"}`);

  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // ---- Diagnostics Check (api.check@pankaj) ----
    if (message.trim().toLowerCase() === "api.check@pankaj") {
      const diag = await buildDiagnosticsReport();
      return NextResponse.json({ response: diag });
    }

    // ---- Creator / Pankaj Query Check ----
    // If the query is about who made the AI or who Pankaj Chakraborty is,
    // return the custom response immediately without searching the internet.
    // But if the query has additional context (e.g., "who is Pankaj Chakraborty, scientist?"),
    // let the normal classification flow handle it.
    if (isCreatorQuery(message)) {
      // For Pankaj queries with extra context (e.g., "who is Pankaj Chakraborty, commerce professor?"),
      // let the classifier decide if it's commerce-related so it can search the internet.
      if (!isPankajWithContext(message)) {
        return NextResponse.json({
          response:
            "Pankaj Chakraborty, a student of Class 12.",
        });
      }
    }

    // ---- History-based Follow-up Check ----
    // If the last assistant response was about Pankaj Chakraborty, intercept follow-up
    // questions that refer to "him", "he", "his", or ask for more info about the creator.
    // This prevents users from tricking the AI by asking follow-ups that reference Pankaj.
    const lastAssistantMsg = [...history].reverse().find((m: any) => m.role === "assistant");
    if (lastAssistantMsg && lastAssistantMsg.content.includes("Pankaj Chakraborty, a student of Class 12.")) {
      const lower = message.toLowerCase().trim();
      const followUpRefs = [
        /\bhim\b/i,
        /\bhe\b/i,
        /\bhis\b/i,
        /more\s+(about|info|information)/i,
        /tell\s+(me|us)\s+more/i,
        /what\s+(else|about|more)/i,
        /anything\s+else/i,
        /can\s+you\s+(tell|give|provide)/i,
        /do\s+(you|u)\s+(have|know)\s+(more|any)/i,
        /explain\s+(about\s+)?(him|it)/i,
        /give\s+more/i,
        /i\s+(want|need)\s+(to\s+)?know/i,
      ];
      const isFollowUp = followUpRefs.some((p) => p.test(lower));
      if (isFollowUp) {
        return NextResponse.json({
          response:
            "Pankaj Chakraborty, a student of Class 12.",
        });
      }
    }

    // Domain Guard Check
    const classification = await classifyQuery(message);

    if (classification === "UNRELATED") {
      return NextResponse.json({
        response:
          "I specialize in commerce, accounting, finance, taxation, economics, and business studies. For general questions, please use ChatGPT.",
        blocked: true,
        classification,
      });
    }

    // Stage 1: Search Supabase for relevant document chunks
    let context = "";
    let contextSource = "";

    try {
      const chunks = await searchChunks(message, 10);

      if (chunks.length > 0) {
        const pdfSources = new Set<string>();

        context = chunks
          .map((chunk) => {
            const src = chunk.filename || "unknown";
            pdfSources.add(src);
            return `[Source: ${src}]\n${chunk.content}`;
          })
          .join("\n\n---\n\n");

        const pdfSourceList = Array.from(pdfSources);
        if (pdfSourceList.length > 0) {
          context += `\n\n---\nPDF Sources in Knowledge Base: ${pdfSourceList.join(", ")}`;
        }

        contextSource = "kb";
      }
    } catch (err) {
      console.error("[Chat] Supabase search error:", err);
    }

    // Stage 2: Fallback to web search if no KB results
    if (!context) {
      try {
        const webContext = await searchWebAsContext(message);
        if (webContext) {
          context = webContext;
          contextSource = "web-search";
        }
      } catch {
        // Web search failed — continue without context
      }
    }

    // Build system prompt with appropriate context instructions
    let contextInstruction = "";
    if (context) {
      if (contextSource === "kb") {
        contextInstruction = `\n\nCRITICAL: You have access to the following context from your knowledge base (PDFs stored in Supabase). EACH chunk is labeled with its [Source: filename.pdf]. Your answer MUST be based primarily on this context. At the end of your answer, list the Sources section with the PDF filenames that you used (formatted as {{source:filename.pdf}}). Only fall back to your own knowledge if the context doesn't fully cover the question.\n\nKnowledge Base Context (Supabase PDFs):\n${context}`;
      } else if (contextSource === "web-search") {
        contextInstruction = `\n\nYour knowledge base (Supabase) did not return sufficient context. Use the following live web search results to answer the user's question. Cite the sources (URLs) when possible. If the search results don't fully answer the question, supplement with your general commerce knowledge.\n\nWeb Search Results:\n${context}`;
      }
    }

    // Check if this is a simple greeting
    const isGreeting = /^(hi|hello|hey|heyy|heyo|sup|yo|hii|hiiii|good\s*(morning|afternoon|evening|day|night)|what'?s\s*up|howdy|wassup)($|[.!?\s]*)/i.test(message.trim());

    // Prepare messages for LLM
    const baseSystemPrompt = `You are Commerce GPT, a specialized AI assistant for commerce education.
You help with accounting, finance, economics, taxation, business law, and auditing.

${isGreeting ? 'The user is greeting you. Respond warmly and briefly in 1-2 sentences, then invite them to ask about commerce topics.' : ''}

For theoretical/commerce questions, structure your answer as follows:
1. Start with "As per Section X of [Book Name / Law Name]," when referencing specific sections or provisions.
2. Explain the concept clearly in body paragraphs.
3. At the end, list Sources with book names and websites used.

To highlight important text, use these markers:
- {{important:text}} for the MOST important points (pink highlight)
- {{mid:text}} for moderately important points (lime green highlight)
- {{source:text}} for source citations (yellow highlight)

Example format:
"As per Section 3 of the Companies Act 2013, {{important:Private limited companies must have a minimum paid-up capital}} as specified. This requirement ensures {{mid:financial stability and regulatory compliance}}.

Sources:
{{source:Companies Act 2013}}
{{source:https://www.mca.gov.in}}"

Use highlights sparingly and only for truly important concepts.

----- NOTEBOOK FORMATTING FOR CALCULATIONS AND STRUCTURED CONTENT -----

Use {{notebook}}...{{/notebook}} markers ONLY when your answer contains:
- Journal entries, ledger accounts, trial balance, balance sheet
- Cash book, trading account, profit and loss account
- ANY mathematical calculation (even simple like 1+1=2)
- Step-by-step numerical solutions
- Depreciation schedules, cost sheets
- Any tabular/columnar financial data
- Ratio analysis with numbers
- Working notes with calculations

Do NOT use {{notebook}} for:
- Plain text explanations and definitions
- Theoretical answers and concepts
- Greetings or simple text responses
- Bullet points without calculations

When you DO use notebook format, follow these rules:
1. Put {{notebook}} on its own line at the start of the calculation section
2. Put {{/notebook}} on its own line at the end
3. Each line becomes one line on the notebook paper
4. Use spaces to align columns properly
5. Show step-by-step working for all calculations
6. Use proper headings like "Journal Entry", "Calculation", "Working Note"
7. Use the rupee symbol for amounts, align figures to the right

Example calculation in notebook:
{{notebook}}
Calculation of Compound Interest

Principal (P) = Rs.50,000
Rate (r) = 8% = 0.08
Time (n) = 3 years

Amount = P x (1 + r)^n
       = 50,000 x (1 + 0.08)^3
       = 50,000 x 1.2597
       = Rs.62,985.60

Compound Interest = Amount - Principal
                  = 62,985.60 - 50,000
                  = Rs.12,985.60
{{/notebook}}

Example journal entry in notebook:
{{notebook}}
Journal Entries in the books of ABC Ltd.

Date        Particulars                          L.F.    Debit(Rs)   Credit(Rs)
2025-04-01  Cash A/c .................. Dr.        50,000
               To Capital A/c                                  50,000
            (Being capital introduced)

2025-04-05  Purchases A/c .............. Dr.       20,000
               To Cash A/c                                     20,000
            (Being goods purchased for cash)

Total                                           70,000      70,000
{{/notebook}}

Example ledger account in notebook:
{{notebook}}
Dr.                    Cash Account                     Cr.

Date        Particulars         J.F.   Amount    Date        Particulars        J.F.   Amount
2025-04-01  To Capital A/c             50,000   2025-04-05  By Purchases A/c           20,000
                                                2025-04-30  By Balance c/d             30,000
                                                                       Total              50,000
2025-05-01  To Balance b/d             30,000
{{/notebook}}

IMPORTANT: You can mix regular text with notebook blocks. Explain concepts in normal text, then show calculations in {{notebook}} blocks. Always put the opening {{notebook}} and closing {{/notebook}} on their own separate lines.${contextInstruction}`;

    const messages: LLMMessage[] = [
      {
        role: "system",
        content: baseSystemPrompt,
      },
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Route to LLM and stream response
    const stream = await routeToLLM(messages);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}