import axios from 'axios';
import xml2js from 'xml2js';
import { LegalFact } from '../types/index.js';
import { SOURCES, RSSSource } from '../config/sources.js';

/**
 * Scraper dla wszystkich źródeł RSS
 */
export async function scrapeAllRSS(): Promise<LegalFact[]> {
  const allFacts: LegalFact[] = [];
  
  for (const source of SOURCES.RSS_SOURCES) {
    try {
      console.log(`📡 Scraping RSS: ${source.name}...`);
      const facts = await scrapeSingleRSS(source);
      allFacts.push(...facts);
      console.log(`✅ ${source.name}: ${facts.length} items`);
    } catch (error) {
      console.error(`❌ Błąd RSS ${source.name}:`, error);
    }
  }
  
  return allFacts;
}

/**
 * Scraper dla pojedynczego kanału RSS
 */
async function scrapeSingleRSS(source: RSSSource): Promise<LegalFact[]> {
  try {
    const response = await axios.get(source.url, { 
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StraznikPrawa/1.0)'
      }
    });

    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true
    });
    
    const result = await parser.parseStringPromise(response.data);
    
    // Obsługa różnych formatów RSS/Atom
    const items = result.rss?.channel?.item || 
                  result.feed?.entry || 
                  [];
    
    const facts: LegalFact[] = [];
    const itemsArray = Array.isArray(items) ? items : [items];

    for (const item of itemsArray) {
      // Parsuj datę (różne formaty w różnych feedach)
      const pubDate = item.pubDate || item.published || item.date || new Date().toISOString();
      const parsedDate = parseRSSDate(pubDate);
      
      // Wyciągnij opis (może być w różnych polach)
      const description = stripHtml(
        item.description || 
        item.summary || 
        item.content || 
        ''
      );
      
      const title = stripHtml(item.title || 'Brak tytułu');
      const link = item.link?.href || item.link || source.url;

      facts.push({
        id: `rss-${sanitizeId(source.category)}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ingestMethod: 'rss',
        eliUri: null,
        title: title,
        summary: description.substring(0, 500), // Max 500 znaków
        date: parsedDate,
        impact: determineImpactFromCategory(source.category),
        category: source.category,
        legalStatus: 'published',
        officialRationale: description,
        sourceUrl: link
      });
    }

    return facts;
  } catch (error) {
    console.error(`RSS Scraper Error (${source.name}):`, error);
    return [];
  }
}

/**
 * Parsuj różne formaty dat RSS
 */
function parseRSSDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Usuń HTML tags z tekstu
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Usuń tagi
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitize ID (usuń polskie znaki)
 */
function sanitizeId(str: string): string {
  return str
    .toLowerCase()
    .replace(/ą/g, 'a').replace(/ć/g, 'c')
    .replace(/ę/g, 'e').replace(/ł/g, 'l')
    .replace(/ń/g, 'n').replace(/ó/g, 'o')
    .replace(/ś/g, 's').replace(/ź/g, 'z')
    .replace(/ż/g, 'z')
    .replace(/[^a-z0-9]/g, '-');
}

/**
 * Określ wpływ na podstawie kategorii
 */
function determineImpactFromCategory(category: string): 'low' | 'medium' | 'high' {
  const cat = category.toLowerCase();
  
  if (cat.includes('dziennik ustaw') || cat.includes('sejm')) {
    return 'high';
  }
  if (cat.includes('monitor') || cat.includes('zus')) {
    return 'medium';
  }
  return 'low';
}
