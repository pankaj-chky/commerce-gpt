import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { KnowledgeEntry } from '../types';

export class KnowledgeBase {
  private client: SupabaseClient | null = null;
  configured: boolean;

  constructor() {
    this.configured = !!config.supabase.url && !!config.supabase.serviceKey;
    if (this.configured) {
      this.client = createClient(config.supabase.url, config.supabase.serviceKey);
    }
  }

  async checkHealth(): Promise<boolean> {
    if (!this.configured || !this.client) return false;
    try {
      const { data, error } = await this.client
        .from('knowledge_entries')
        .select('id')
        .limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  async search(query: string, limit: number = 5): Promise<KnowledgeEntry[]> {
    if (!this.client) throw new Error('Knowledge Base not configured');
    try {
      const { data, error } = await this.client
        .from('knowledge_entries')
        .select('*')
        .ilike('content', `%${query}%`)
        .limit(limit)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Knowledge Base search error:', error);
      throw error;
    }
  }

  async addEntry(content: string, metadata: Record<string, any> = {}): Promise<KnowledgeEntry> {
    if (!this.client) throw new Error('Knowledge Base not configured');
    const { data, error } = await this.client
      .from('knowledge_entries')
      .insert({ content, metadata })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteEntry(id: string): Promise<void> {
    if (!this.client) throw new Error('Knowledge Base not configured');
    const { error } = await this.client
      .from('knowledge_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}