import express from 'express';
import cors from 'cors';
import { config } from './config';
import { Diagnostics } from './diagnostics';
import { ProviderManager } from './providers/manager';
import { KnowledgeBase } from './knowledge/supabase';
import { WebSearch } from './search/websearch';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();
const port = config.port;

// Middleware
app.use(cors());
app.use(express.json());

const diagnostics = new Diagnostics();
const providers = new ProviderManager();
const knowledgeBase = new KnowledgeBase();
const webSearch = new WebSearch();

// Routes

// GET /api/diagnostics - System diagnostics
app.get('/api/diagnostics', async (req, res) => {
  try {
    const result = await diagnostics.run();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to run diagnostics' });
  }
});

// POST /api/chat - Send a message to the LLM
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    const result = await providers.sendMessage(messages);
    res.json(result);
  } catch (error: any) {
    res.status(503).json({ error: error.message || 'Failed to process message' });
  }
});

// POST /api/knowledge/search - Search knowledge base
app.post('/api/knowledge/search', async (req, res) => {
  try {
    const { query, limit } = req.body;
    if (!query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    if (!knowledgeBase.configured && webSearch.configured) {
      // Fallback to web search
      const results = await webSearch.search(query, limit || 5);
      res.json({ source: 'web', results });
      return;
    }

    const results = await knowledgeBase.search(query, limit || 5);
    res.json({ source: 'kb', results });
  } catch (error: any) {
    // Fallback to web search
    if (webSearch.configured) {
      try {
        const { query, limit } = req.body;
        const results = await webSearch.search(query, limit || 5);
        res.json({ source: 'web_fallback', results });
        return;
      } catch {}
    }
    res.status(500).json({ error: error.message || 'Search failed' });
  }
});

// POST /api/knowledge/add - Add entry to knowledge base
app.post('/api/knowledge/add', async (req, res) => {
  try {
    const { content, metadata } = req.body;
    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    const entry = await knowledgeBase.addEntry(content, metadata || {});
    res.json(entry);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to add entry' });
  }
});

// GET /api/health - Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Commerce GPT server running on port ${port}`);
  console.log(`API: http://localhost:${port}/api`);
  console.log(`Diagnostics: http://localhost:${port}/api/diagnostics`);
});

export default app;