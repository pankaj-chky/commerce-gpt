# Commerce GPT

Multi-provider LLM system with knowledge base, embeddings, and web search fallback.

## Architecture

```
commerce-gpt/
├── src/
│   ├── providers/          # LLM provider implementations
│   │   ├── base.ts         # Abstract base provider
│   │   ├── groq.ts         # Groq (llama-3.3-70b-versatile)
│   │   ├── gemini.ts       # Google Gemini (gemini-2.0-flash)
│   │   ├── deepseek.ts     # DeepSeek (deepseek-chat)
│   │   └── manager.ts      # Provider orchestration & failover
│   ├── knowledge/
│   │   └── supabase.ts     # Supabase knowledge base (ILIKE search)
│   ├── embeddings/
│   │   ├── voyageai.ts     # VoyageAI embeddings
│   │   └── unstructured.ts # Unstructured.io document parsing
│   ├── search/
│   │   └── websearch.ts    # Web search (SerpAPI / Tavily)
│   ├── middleware/
│   │   └── errorHandler.ts # Express error handling
│   ├── config.ts           # Environment configuration
│   ├── diagnostics.ts      # System diagnostics
│   ├── server.ts           # Express API server
│   ├── types.ts            # TypeScript interfaces
│   └── index.ts            # Entry point
├── .env                    # Configuration (not committed)
├── .env.example            # Configuration template
├── package.json
└── tsconfig.json
```

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API keys:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Run diagnostics:**
   ```bash
   npm run diagnostics
   ```

4. **Start the server:**
   ```bash
   npm run server
   ```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/diagnostics` | System health & configuration status |
| GET | `/api/health` | Simple health check |
| POST | `/api/chat` | Send message to LLM |
| POST | `/api/knowledge/search` | Search knowledge base (falls back to web) |
| POST | `/api/knowledge/add` | Add entry to knowledge base |

### POST /api/chat
```json
{
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello!" }
  ]
}
```

### POST /api/knowledge/search
```json
{
  "query": "search term",
  "limit": 5
}
```

## LLM Providers

- **Groq** — llama-3.3-70b-versatile (OpenAI-compatible API)
- **Gemini** — gemini-2.0-flash (Google Generative AI)
- **DeepSeek** — deepseek-chat (OpenAI-compatible API)

### Auto-degradation
Providers auto-degrade on HTTP 401/402/403/429 with a 5-minute cooldown.

## Knowledge Base

Uses Supabase with ILIKE search. Falls back to web search if KB is unavailable.

## Web Search

Supports SerpAPI and Tavily providers.

## Embeddings

- **VoyageAI** — Text embeddings
- **Unstructured** — Document parsing (PDF, DOCX, etc.)