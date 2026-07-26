export interface LLMProviderConfig {
  name: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface LLMProvider {
  name: string;
  model: string;
  configured: boolean;
  healthy: boolean;
  cooldownUntil: number | null;
  sendMessage(messages: ChatMessage[]): Promise<string>;
  checkHealth(): Promise<boolean>;
  isOnCooldown(): boolean;
  setCooldown(minutes?: number): void;
  clearCooldown(): void;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DiagnosticsResult {
  uptime: number;
  serverTime: string;
  providers: ProviderStatus[];
  knowledgeBase: KnowledgeBaseStatus;
  webSearch: WebSearchStatus;
  embeddings: EmbeddingsStatus;
  info: string[];
}

export interface ProviderStatus {
  name: string;
  model: string;
  configured: boolean;
  healthy: boolean;
  error?: string;
}

export interface KnowledgeBaseStatus {
  configured: boolean;
  reachable: boolean;
  error?: string;
}

export interface WebSearchStatus {
  configured: number;
  available: boolean;
  error?: string;
}

export interface EmbeddingsStatus {
  voyageai: { configured: boolean; error?: string };
  unstructured: { configured: boolean; error?: string };
}

export interface KnowledgeEntry {
  id: string;
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}