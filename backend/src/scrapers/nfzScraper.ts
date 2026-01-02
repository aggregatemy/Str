import { chromium } from 'playwright';
import { LegalFact } from '../types/index.js';

// Helper function to build NFZ URL
function buildNfzUrl(link: string | null | undefined): string {
  if (link?.startsWith('http')) {
    return link;
  }
  if (link) {
    return `https://baw.nfz.gov.pl${link}`;
  }
  return 'https://baw.nfz.gov.pl/NFZ/tabBrowser/mainPage';
}

/**
 * NFZ BAW (Baza Aktów Własnych) - Scraper z Playwright
 * Obsługuje DevExpress Grid z JavaScript-ową renderacją
 */
export async function scrapeNFZ(): Promise<LegalFact[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 NFZ: Pobieranie danych z baw.nfz.gov.pl...');
    
    // Czekaj na załadowanie strony
    await page.goto('https://baw.nfz.gov.pl/NFZ/tabBrowser/mainPage', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Czekaj na DevExpress Grid
    await page.waitForSelector('.dxgvTable, .dxgvDataRow, table tbody tr', {
      timeout: 15000
    }).catch(() => {
      console.warn('⚠️  NFZ: Grid nie znaleziony, próbuję alternatywnego selektora');
      return null;
    });

    // Czekaj dodatkowe 2s na render
    await page.waitForTimeout(2000);

    // Pobierz dane z DevExpress Grid lub zwykłej tabeli
    const facts = await page.evaluate(() => {
      const results: any[] = [];
      
      // Spróbuj różne selektory
      const rows = document.querySelectorAll('.dxgvDataRow, table tbody tr, [data-row="true"]');
      
      if (rows.length === 0) {
        console.warn('⚠️  Brak wierszy w grid');
        return results;
      }

      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 2) return;

        const number = cells[0]?.textContent?.trim() || '';
        const title = cells[1]?.textContent?.trim() || '';
        const date = cells[2]?.textContent?.trim() || new Date().toISOString().split('T')[0];
        const link = cells[1]?.querySelector('a')?.getAttribute('href') || '';

        if (number || title) {
          results.push({
            number: number || 'unknown',
            title: title || 'Bez tytułu',
            date: date,
            link: link
          });
        }
      });

      return results;
    });

    console.log(`📊 NFZ: Znaleziono ${facts.length} zarządzeń`);

    // Mapuj na LegalFact
    const legalFacts: LegalFact[] = facts.map((fact, idx) => {
      const sourceUrl = buildNfzUrl(fact.link);
      
      return {
        id: `nfz-${fact.number.replaceAll('/', '-')}-${idx}`,
        ingestMethod: 'scraper',
        eliUri: null,
        title: fact.title,
        summary: fact.title,
        date: parseNFZDate(fact.date),
        impact: 'medium',
        category: 'NFZ Zarządzenia',
        legalStatus: 'published',
        officialRationale: '',
        sourceUrl
      };
    });

    return legalFacts;
  } catch (error: any) {
    console.error('❌ NFZ Scraper Error:', error.message);
    
    // Fallback: spróbuj alternatywnego źródła
    console.log('🔄 NFZ: Próbuję alternatywnego URL...');
    try {
      return await scrapeNFZAlternative();
    } catch (altError) {
      console.error('❌ NFZ Alternative Error:', altError);
      return [];
    }
  } finally {
    await browser.close();
  }
}

/**
 * Alternatywne źródło NFZ - Komunikaty i Zarządzenia (główna strona)
 */
async function scrapeNFZAlternative(): Promise<LegalFact[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://www.nfz.gov.pl/zarzadzenia-prezesa/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    const facts = await page.evaluate(() => {
      const results: any[] = [];
      
      // Szukaj linków do zarządzeń
      const links = document.querySelectorAll('a[href*="zarzadzenia"], a[href*="zaradzenia"], .post-link, article a');
      
      links.forEach((link) => {
        const title = link.textContent?.trim();
        const href = link.getAttribute('href');
        
        if (title && href) {
          results.push({
            title: title.substring(0, 200),
            link: href
          });
        }
      });

      return results.slice(0, 20); // Limit do 20 dla szybkości
    });

    console.log(`📊 NFZ Alternative: Znaleziono ${facts.length} ogłoszeń`);

    const legalFacts: LegalFact[] = facts.map((fact, idx) => {
      const sourceUrl = fact.link?.startsWith('http') 
        ? fact.link 
        : `https://www.nfz.gov.pl${fact.link}`;
      
      return {
        id: `nfz-alt-${idx}`,
        ingestMethod: 'scraper',
        eliUri: null,
        title: fact.title,
        summary: fact.title,
        date: new Date().toISOString().split('T')[0],
        impact: 'medium',
        category: 'NFZ Zarządzenia',
        legalStatus: 'published',
        officialRationale: '',
        sourceUrl
      };
    });

    return legalFacts;
  } finally {
    await browser.close();
  }
}

function parseNFZDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  // Format: "DD.MM.YYYY" -> "YYYY-MM-DD"
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  
  // Format: "DD-MM-YYYY"
  const altParts = dateStr.split('-');
  if (altParts.length === 3 && altParts[2].length === 4) {
    return `${altParts[2]}-${altParts[1]}-${altParts[0]}`;
  }
  
  return new Date().toISOString().split('T')[0];
}
