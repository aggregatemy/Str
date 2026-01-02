import axios from 'axios';
import { LegalFact } from '../types/index.js';

export async function scrapeELI(): Promise<LegalFact[]> {
  try {
    const response = await axios.get('https://isap.sejm.gov.pl/api/eli', {
      params: { limit: 50 },
      timeout: 10000
    });

    const results: LegalFact[] = [];
    const items = response.data?.items || [];

    for (const item of items) {
      results.push({
        id: item.eliUri || `eli-${Date.now()}`,
        ingestMethod: 'eli',
        eliUri: item.eliUri,
        title: item.title || 'Brak tytułu',
        summary: item.abstract || 'Brak streszczenia',
        date: item.publicationDate || new Date().toISOString().split('T')[0],
        impact: determineImpact(item.type),
        category: item.type || 'Inne',
        legalStatus: item.status || 'unknown',
        officialRationale: item.justification || '',
        sourceUrl: `https://isap.sejm.gov.pl${item.eliUri}`
      });
    }

    return results;
  } catch (error) {
    console.error('❌ ELI Scraper Error:', error);
    return [];
  }
}

function determineImpact(type: string): 'low' | 'medium' | 'high' {
  const highTypes = ['ustawa', 'konstytucja'];
  const mediumTypes = ['rozporządzenie'];
  
  if (highTypes.some(t => type?.toLowerCase().includes(t))) return 'high';
  if (mediumTypes.some(t => type?.toLowerCase().includes(t))) return 'medium';
  return 'low';
}
