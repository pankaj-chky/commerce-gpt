import { LLMProvider, ChatMessage } from '../types';

export abstract class BaseLLMProvider implements LLMProvider {
  name: string;
  model: string;
  configured: boolean;
  healthy: boolean;
  cooldownUntil: number | null = null;

  constructor(name: string, model: string, configured: boolean) {
    this.name = name;
    this.model = model;
    this.configured = configured;
    this.healthy = false;
  }

  abstract sendMessage(messages: ChatMessage[]): Promise<string>;
  abstract checkHealth(): Promise<boolean>;

  isOnCooldown(): boolean {
    if (!this.cooldownUntil) return false;
    return Date.now() < this.cooldownUntil;
  }

  setCooldown(minutes: number = 5): void {
    this.cooldownUntil = Date.now() + minutes * 60 * 1000;
    this.healthy = false;
  }

  clearCooldown(): void {
    this.cooldownUntil = null;
  }

  protected shouldDegrade(statusCode: number): boolean {
    return [401, 402, 403, 429].includes(statusCode);
  }
}