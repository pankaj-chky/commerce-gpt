import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),

  // LLM Providers
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: 'llama-3.3-70b-versatile',
    baseUrl: 'https://api.groq.com/openai/v1',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-2.0-flash',
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    model: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com/v1',
  },

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
  },

  // Embeddings
  voyageai: {
    apiKey: process.env.VOYAGEAI_API_KEY || '',
  },
  unstructured: {
    apiKey: process.env.UNSTRUCTURED_API_KEY || '',
  },

  // Web Search
  webSearch: {
    apiKey: process.env.WEB_SEARCH_API_KEY || '',
    provider: process.env.WEB_SEARCH_PROVIDER || 'serpapi',
  },
};

export function isConfigured(value: string): boolean {
  return value !== undefined && value !== null && value.trim().length > 0;
}