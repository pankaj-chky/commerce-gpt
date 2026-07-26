import { LLMProvider, ChatMessage } from '../types';
import { GroqProvider } from './groq';
import { GeminiProvider } from './gemini';
import { DeepseekProvider } from './deepseek';

export class ProviderManager {
  private providers: LLMProvider[] = [];

  constructor() {
    this.providers = [
      new GroqProvider(),
      new GeminiProvider(),
      new DeepseekProvider(),
    ];
  }

  getAllProviders(): LLMProvider[] {
    return this.providers;
  }

  getConfiguredProviders(): LLMProvider[] {
    return this.providers.filter(p => p.configured);
  }

  getHealthyProviders(): LLMProvider[] {
    return this.providers.filter(p => p.configured && p.healthy && !p.isOnCooldown());
  }

  async checkAllHealth(): Promise<void> {
    const checks = this.providers.map(p => p.checkHealth());
    await Promise.allSettled(checks);
  }

  async sendMessage(messages: ChatMessage[]): Promise<{ content: string; provider: string }> {
    const healthyProviders = this.getHealthyProviders();

    if (healthyProviders.length === 0) {
      // Try to re-check health for configured providers
      await this.checkAllHealth();
      const refreshedProviders = this.getHealthyProviders();
      if (refreshedProviders.length === 0) {
        throw new Error('No healthy LLM providers available');
      }
      // Use the first now-healthy provider
      const provider = refreshedProviders[0];
      const content = await provider.sendMessage(messages);
      return { content, provider: provider.name };
    }

    // Try providers in order, fall through on failure
    for (const provider of healthyProviders) {
      try {
        const content = await provider.sendMessage(messages);
        return { content, provider: provider.name };
      } catch (error) {
        console.warn(`Provider ${provider.name} failed, trying next...`);
        continue;
      }
    }

    throw new Error('All providers failed to process the message');
  }
}