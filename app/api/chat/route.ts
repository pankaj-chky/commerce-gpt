import { NextRequest, NextResponse } from "next/server";
import { classifyQuery } from "@/lib/guard/classifier";
import { generateEmbedding } from "@/lib/embeddings/voyage";
import { queryVectors } from "@/lib/vector/pinecone";
import { searchWebAsContext } from "@/lib/search/web-search";
import { routeToLLM, LLMMessage } from "@/lib/ai/router";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
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

    // Stage 1: Try vector search (Pinecone) for RAG context
    let context = "";
    let contextSource = ""; // track where context came from for debugging

    try {
      const embedding = await generateEmbedding(message);
      const relevantChunks = await queryVectors(embedding, 5);
      if (relevantChunks.length > 0) {
        context = relevantChunks
          .map((chunk) => chunk.content)
          .join("\n\n---\n\n");
        contextSource = "vector-db";
      }
    } catch {
      // Embeddings or vector search not configured — continue
    }

    // Stage 2: Fallback to web search if no vector results
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
      if (contextSource === "vector-db") {
        contextInstruction = `\n\nUse the following context from your knowledge base to answer the user's question. If the context doesn't contain enough information, use your general knowledge about commerce topics, but be clear when you're doing so.\n\nContext:\n${context}`;
      } else if (contextSource === "web-search") {
        contextInstruction = `\n\nUse the following live web search results to answer the user's question. Cite the sources when possible. If the search results don't fully answer the question, supplement with your general commerce knowledge.\n\n${context}`;
      }
    }

    // Prepare messages for LLM
    const messages: LLMMessage[] = [
      {
        role: "system",
        content: `You are Commerce GPT, a specialized AI assistant for commerce education.
You help with accounting, finance, economics, taxation, business law, and auditing.${contextInstruction}`,
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
