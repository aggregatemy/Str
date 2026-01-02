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

const HEALTH_KEYWORDS = ['zdrowi', 'medycz', 'lecznic', 'pacjent', 'świadcze', 'zdrowot', 'aptec', 'lek'];
const CUTOFF_DAYS = 150;
const MAX_POSITIONS = 50;

/**
 * Sprawdź czy akt związany ze zdrowiem
 */
function isHealthRelated(act: any): boolean {
  const titleMatch = act.title?.toLowerCase().match(new RegExp(HEALTH_KEYWORDS.join('|')));
  const keywordsMatch = act.keywords?.some((k: string) => 
    HEALTH_KEYWORDS.some(hw => k.toLowerCase().includes(hw))
  );
  return titleMatch || keywordsMatch;
}

/**
 * Sprawdź czy data aktu mieści się w zakresie
 */
function isWithinDateRange(announceDate: string | null): boolean {
  if (!announceDate) return true;
  const date = new Date(announceDate);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - CUTOFF_DAYS);
  return date >= cutoffDate;
}

/**
 * Konwertuj akt Sejmu na LegalFact
 */
function convertSejmActToLegalFact(act: any): LegalFact {
  const publishDate = act.promulgation || act.announcementDate || new Date().toISOString().split('T')[0];
  const entryIntoForceText = act.entryIntoForce ? `. Wchodzi w życie: ${act.entryIntoForce}` : '';
  const summary = `${act.type}. Status: ${act.inForce || 'nieznany'}${entryIntoForceText}`;
  
  return {
    id: `sejm-${act.ELI.replaceAll('/', '-')}`,
    ingestMethod: 'eli',
    eliUri: act.ELI,
    title: act.title || 'Brak tytułu',
    summary,
    date: publishDate,
    impact: act.inForce === 'IN_FORCE' ? 'high' : 'medium',
    category: 'DZIENNIK USTAW',
    legalStatus: act.status || 'nieznany',
    officialRationale: `${act.type} wydane przez ${act.releasedBy?.join(', ') || 'nieznany organ'}. Słowa kluczowe: ${act.keywords?.join(', ') || 'brak'}.`,
    sourceUrl: `https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=${act.address}`
  };
}

/**
 * Pobierz akt z API Sejmu
 */
async function fetchSejmAct(year: number, position: number): Promise<SejmAct | null> {
  try {
    const response = await axios.get(`${SOURCES.ELI_API_SEJM}acts/DU/${year}/${position}`, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Straznik-Prawa-Medycznego/1.0',
        'Accept': 'application/json'
      },
      validateStatus: (status) => status === 200
    });
    return response.data;
  } catch {
    return null;
  }
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
    
    console.log('📡 Sejm API: Pobieranie aktów prawnych z DU...');

    // Pobieramy akty z bieżącego roku
    for (let pos = 1; pos <= MAX_POSITIONS; pos++) {
      const act = await fetchSejmAct(currentYear, pos);
      if (!act) continue;
      
      if (!isHealthRelated(act)) continue;
      if (!isWithinDateRange(act.publishDate || null)) continue;

      facts.push(convertSejmActToLegalFact(act));
      
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
