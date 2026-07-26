import OpenAI from 'openai';
import { ChatMessage } from '../types';
import { BaseLLMProvider } from './base';
import { config } from '../config';

export class GroqProvider extends BaseLLMProvider {
  private client: OpenAI | null = null;

  constructor() {
    const configured = !!config.groq.apiKey;
    super('groq', config.groq.model, configured);
    if (configured) {
      this.client = new OpenAI({
        apiKey: config.groq.apiKey,
        baseURL: config.groq.baseUrl,
      });
    }
  }

  async checkHealth(): Promise<boolean> {
    if (!this.configured || !this.client) {
      this.healthy = false;
      return false;
    }
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      });
      this.healthy = !!response.choices?.[0]?.message?.content;
      return this.healthy;
    } catch (error: any) {
      if (error?.status && this.shouldDegrade(error.status)) {
        this.setCooldown();
      }
      this.healthy = false;
      return false;
    }
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    if (!this.client) throw new Error('Groq provider not configured');
    if (this.isOnCooldown()) throw new Error('Groq provider is on cooldown');

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      });
      return response.choices?.[0]?.message?.content || '';
    } catch (error: any) {
      if (error?.status && this.shouldDegrade(error.status)) {
        this.setCooldown();
      }
      throw error;
    }
  }
}