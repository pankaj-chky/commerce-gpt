import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatMessage } from '../types';
import { BaseLLMProvider } from './base';
import { config } from '../config';

export class GeminiProvider extends BaseLLMProvider {
  private client: GoogleGenerativeAI | null = null;

  constructor() {
    const configured = !!config.gemini.apiKey;
    super('gemini', config.gemini.model, configured);
    if (configured) {
      this.client = new GoogleGenerativeAI(config.gemini.apiKey);
    }
  }

  async checkHealth(): Promise<boolean> {
    if (!this.configured || !this.client) {
      this.healthy = false;
      return false;
    }
    try {
      const model = this.client.getGenerativeModel({ model: this.model });
      const result = await model.generateContent('ping');
      this.healthy = !!result.response.text();
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
    if (!this.client) throw new Error('Gemini provider not configured');
    if (this.isOnCooldown()) throw new Error('Gemini provider is on cooldown');

    try {
      const model = this.client.getGenerativeModel({ model: this.model });

      // Convert chat messages to Gemini format
      const history = messages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const lastMessage = messages[messages.length - 1];

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastMessage.content);
      return result.response.text();
    } catch (error: any) {
      if (error?.status && this.shouldDegrade(error.status)) {
        this.setCooldown();
      }
      throw error;
    }
  }
}