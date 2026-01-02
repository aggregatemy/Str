import { LegalFact } from '../types/index.js';
import { getSourcesByPriority, ELISource } from '../config/eliSources.js';
import { ELIClient } from './eli/eliClient.js';

/**
 * Główny scraper ELI - agreguje dane ze wszystkich źródeł
 */
export async function scrapeAllELI(): Promise<LegalFact[]> {
  const sources = getSourcesByPriority();
  const allFacts: LegalFact[] = [];
  
  console.log(`🇪🇺 Uruchamianie scraperów ELI dla ${sources.length} źródeł...`);

  // Pobieraj równolegle (max 3 jednocześnie, żeby nie przeciążyć)
  for (let i = 0; i < sources.length; i += 3) {
    const batch = sources.slice(i, i + 3);
    
    const results = await Promise.allSettled(
      batch.map(source => scrapeELISource(source))
    );

    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        allFacts.push(...result.value);
      } else {
        console.error(`❌ Błąd ELI (${batch[idx].name}):`, result.reason);
      }
    });
  }

  console.log(`✅ ELI: Pobrano łącznie ${allFacts.length} dokumentów`);
  return allFacts;
}

/**
 * Pobierz dane z pojedynczego źródła ELI
 */
async function scrapeELISource(source: ELISource): Promise<LegalFact[]> {
  const client = new ELIClient(source);
  return await client.fetchRecentDocuments(150); // Ostatnie 150 dni (bufor dla filtrów 90d + 30d zapas)
}

/**
 * Backward compatibility - stary scraper dla Sejmu
 */
export async function scrapeELI(): Promise<LegalFact[]> {
  // Pobierz tylko ze źródła "sejm"
  const sources = getSourcesByPriority();
  const sejmSource = sources.find(s => s.id === 'sejm');
  
  if (!sejmSource) {
    console.warn('⚠️ Źródło ELI Sejmu nie znalezione');
    return [];
  }

  return scrapeELISource(sejmSource);
}
