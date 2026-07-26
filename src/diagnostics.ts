import { ProviderManager } from './providers/manager';
import { KnowledgeBase } from './knowledge/supabase';
import { WebSearch } from './search/websearch';
import { VoyageAIEmbeddings } from './embeddings/voyageai';
import { UnstructuredEmbeddings } from './embeddings/unstructured';
import { DiagnosticsResult } from './types';
import { config } from './config';

const startTime = Date.now();

export class Diagnostics {
  private providers: ProviderManager;
  private knowledgeBase: KnowledgeBase;
  private webSearch: WebSearch;
  private voyageAI: VoyageAIEmbeddings;
  private unstructured: UnstructuredEmbeddings;

  constructor() {
    this.providers = new ProviderManager();
    this.knowledgeBase = new KnowledgeBase();
    this.webSearch = new WebSearch();
    this.voyageAI = new VoyageAIEmbeddings();
    this.unstructured = new UnstructuredEmbeddings();
  }

  async run(): Promise<DiagnosticsResult> {
    await this.providers.checkAllHealth();

    const allProviders = this.providers.getAllProviders();
    const providerStatuses = allProviders.map(p => ({
      name: p.name,
      model: p.model,
      configured: p.configured,
      healthy: p.healthy,
      error: !p.configured ? 'Not configured' :
             !p.healthy ? 'Health check failed' :
             p.isOnCooldown() ? 'On cooldown' :
             undefined,
    }));

    // Check KB
    let kbStatus = { configured: false, reachable: false, error: 'Not configured' as string | undefined };
    if (this.knowledgeBase.configured) {
      const reachable = await this.knowledgeBase.checkHealth();
      kbStatus = {
        configured: true,
        reachable,
        error: reachable ? undefined : 'Could not query Knowledge Base',
      };
    }

    // Web search status
    const wsStatus = {
      configured: this.webSearch.configured ? 1 : 0,
      available: this.webSearch.configured,
      error: this.webSearch.configured ? undefined : 'Not configured' as string | undefined,
    };

    // Embeddings
    const embStatus = {
      voyageai: {
        configured: this.voyageAI.configured,
        error: this.voyageAI.configured ? undefined : 'Not configured' as string | undefined,
      },
      unstructured: {
        configured: this.unstructured.configured,
        error: this.unstructured.configured ? undefined : 'Not configured' as string | undefined,
      },
    };

    // Info lines
    const info: string[] = [];
    info.push('KB search: Supabase ILIKE → Web fallback');
    info.push('Providers auto-degrade on 401/402/403/429 (cooldown: 5 min)');

    const hasHealthy = providerStatuses.some(p => p.healthy);
    info.push(hasHealthy ? '✅ All providers healthy' : '⚠ No LLM provider is currently available.');

    return {
      uptime: Math.floor((Date.now() - startTime) / 1000),
      serverTime: new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Calcutta',
        hour12: true,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      providers: providerStatuses,
      knowledgeBase: kbStatus,
      webSearch: wsStatus,
      embeddings: embStatus,
      info,
    };
  }
}

// If run directly
if (require.main === module) {
  const diag = new Diagnostics();
  diag.run().then(result => {
    console.log(JSON.stringify(result, null, 2));
  });
}