import { config } from './config';
import { ProviderManager } from './providers/manager';
import { Diagnostics } from './diagnostics';

async function main() {
  console.log('🚀 Commerce GPT System');
  console.log('─────────────────────');
  console.log(`Server Time: ${new Date().toLocaleString()}`);
  console.log('');

  // Run diagnostics
  const diagnostics = new Diagnostics();
  const result = await diagnostics.run();

  // Print provider status
  console.log('🤖 LLM Providers:');
  for (const p of result.providers) {
    const icon = p.configured ? (p.healthy ? '✅' : '⚠️') : '❌';
    console.log(`  ${icon} ${p.name} (${p.model})${p.error ? ': ' + p.error : ''}`);
  }
  console.log('');

  // Print KB status
  console.log('📚 Knowledge Base (Supabase):');
  console.log(`  ${result.knowledgeBase.reachable ? '✅' : '⚠'} ${result.knowledgeBase.error || 'Ready'}`);
  console.log('');

  // Print web search status
  console.log('🌐 Web Search Fallback:');
  console.log(`  Configured: ${result.webSearch.configured}`);
  console.log(`  Status: ${result.webSearch.available ? '✅' : '⚠'} ${result.webSearch.error || 'Available'}`);
  console.log('');

  // Print embeddings status
  console.log('🧮 Embeddings:');
  console.log(`  VoyageAI: ${result.embeddings.voyageai.configured ? '✅' : '⚠'} ${result.embeddings.voyageai.error || 'Ready'}`);
  console.log(`  Unstructured: ${result.embeddings.unstructured.configured ? '✅' : '⚠'} ${result.embeddings.unstructured.error || 'Ready'}`);
  console.log('');

  // Print info
  console.log('ℹ️ Info:');
  for (const line of result.info) {
    console.log(`  • ${line}`);
  }
  console.log('');

  // Start server if we have at least one provider configured
  const hasProvider = result.providers.some(p => p.configured);
  if (hasProvider) {
    console.log('Starting Express server...');
    require('./server');
  } else {
    console.log('⚠️ No providers configured. Set API keys in .env file.');
    console.log('   Run with: npm run server');
  }
}

main().catch(console.error);