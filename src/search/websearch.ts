import axios from 'axios';
import { config } from '../config';
import { SearchResult } from '../types';

export class WebSearch {
  configured: boolean;
  private provider: string;

  constructor() {
    this.configured = !!config.webSearch.apiKey;
    this.provider = config.webSearch.provider;
  }

  async search(query: string, limit: number = 5): Promise<SearchResult[]> {
    if (!this.configured) throw new Error('Web search not configured');

    switch (this.provider) {
      case 'serpapi':
        return this.searchSerpApi(query, limit);
      case 'tavily':
        return this.searchTavily(query, limit);
      default:
        return this.searchSerpApi(query, limit);
    }
  }

  private async searchSerpApi(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          q: query,
          api_key: config.webSearch.apiKey,
          num: limit,
        },
      });

      const results = response.data?.organic_results || [];
      return results.slice(0, limit).map((r: any) => ({
        title: r.title || '',
        url: r.link || '',
        snippet: r.snippet || '',
      }));
    } catch (error) {
      console.error('SerpAPI search error:', error);
      throw error;
    }
  }

  private async searchTavily(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const response = await axios.post('https://api.tavily.com/search', {
        api_key: config.webSearch.apiKey,
        query,
        max_results: limit,
      });

      const results = response.data?.results || [];
      return results.slice(0, limit).map((r: any) => ({
        title: r.title || '',
        url: r.url || '',
        snippet: r.content || '',
      }));
    } catch (error) {
      console.error('Tavily search error:', error);
      throw error;
    }
  }
}