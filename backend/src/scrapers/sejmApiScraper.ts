import axios from 'axios';
import { LegalFact } from '../types/index.js';
import { SOURCES } from '../config/sources.js';

interface SejmAct {
  eli: string;
  title: string;
  status?: string;
  publishDate?: string;
  effectiveDate?: string;
  annulmentDate?: string | null;
  textContentUrl?: string;
}

/**
 * Scraper dla nowego API Sejmu (api.sejm.gov.pl/eli/)
 * Pobiera akty prawne z Dziennika Ustaw z ostatnich 90 dni
 * API Sejmu nie ma endpointu /search, więc iterujemy po datach
 */
export async function scrapeSejmAPI(): Promise<LegalFact[]> {
  try {
    const facts: LegalFact[] = [];
    const currentYear = new Date().getFullYear();
    const healthKeywords = ['zdrowi', 'medycz', 'lecznic', 'pacjent', 'świadcze', 'zdrowot', 'aptec', 'lek'];
    
    console.log('📡 Sejm API: Pobieranie aktów prawnych z DU...');

    // Pobieramy akty z bieżącego roku (ostatnie 50 pozycji)
    for (let pos = 1; pos <= 50; pos++) {
      try {
        const response = await axios.get(`${SOURCES.ELI_API_SEJM}acts/DU/${currentYear}/${pos}`, {
          timeout: 5000,
          headers: {
            'User-Agent': 'Straznik-Prawa-Medycznego/1.0',
            'Accept': 'application/json'
          },
          validateStatus: (status) => status === 200 // Tylko 200 OK
        });

        const act = response.data;
        
        // Filtrujemy tylko akty związane ze zdrowiem
        const isHealthRelated = act.title?.toLowerCase().match(new RegExp(healthKeywords.join('|'))) ||
                                act.keywords?.some((k: string) => healthKeywords.some(hw => k.toLowerCase().includes(hw)));

        if (!isHealthRelated) {
          continue;
        }

        // Sprawdź czy akt jest z ostatnich 150 dni (bufor dla filtrów 90d + 30d zapas + 30d margin)
        const announceDate = act.announcementDate ? new Date(act.announcementDate) : null;
        if (announceDate) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - 150);
          if (announceDate < cutoffDate) {
            continue; // Zbyt stary
          }
        }

        const publishDate = act.promulgation || act.announcementDate || new Date().toISOString().split('T')[0];

        facts.push({
          id: `sejm-${act.ELI.replace(/\//g, '-')}`,
          ingestMethod: 'eli',
          eliUri: act.ELI,
          title: act.title || 'Brak tytułu',
          summary: `${act.type}. Status: ${act.inForce || 'nieznany'}. ${act.entryIntoForce ? `Wchodzi w życie: ${act.entryIntoForce}` : ''}`,
          date: publishDate,
          impact: act.inForce === 'IN_FORCE' ? 'high' : 'medium',
          category: 'DZIENNIK USTAW',
          legalStatus: act.status || 'nieznany',
          officialRationale: `${act.type} wydane przez ${act.releasedBy?.join(', ') || 'nieznany organ'}. Słowa kluczowe: ${act.keywords?.join(', ') || 'brak'}.`,
          sourceUrl: `https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=${act.address}`
        });
      } catch (actError: any) {
        // 404 = pozycja nie istnieje, skip
        if (actError.response?.status === 404) {
          continue;
        }
        // Inne błędy - loguj warning
        if (actError.code !== 'ECONNABORTED') { // Ignoruj timeouty
          console.warn(`⚠️ Sejm API: Błąd dla DU/${currentYear}/${pos}: ${actError.message}`);
        }
      }

      // Rate limiting - czekaj 100ms między requestami
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Sejm API: Pobrano ${facts.length} dokumentów`);
    return facts;
  } catch (error: any) {
    console.error(`❌ Sejm API Error:`, error.message || error);
    return [];
  }
}

/**
 * Pobiera szczegóły konkretnego aktu z API Sejmu
 */
export async function fetchActDetails(eli: string): Promise<SejmAct | null> {
  try {
    const response = await axios.get(`${SOURCES.ELI_API_SEJM}acts/${eli}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Straznik-Prawa-Medycznego/1.0',
        'Accept': 'application/json'
      }
    });

    return response.data;
  } catch (error: any) {
    console.error(`❌ Błąd pobierania szczegółów aktu ${eli}:`, error.message);
    return null;
  }
}
