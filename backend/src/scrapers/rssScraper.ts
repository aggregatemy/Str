import axios from 'axios';
import xml2js from 'xml2js';
import { LegalFact } from '../types/index.js';

export async function scrapeRSS(url: string, source: string): Promise<LegalFact[]> {
  try {
    const response = await axios.get(url, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    // Parser XML z tolerancją na błędy
    const parser = new xml2js.Parser({
      strict: false, // Mniej rygorystyczny parsing
      normalize: true,
      normalizeTags: true,
      trim: true,
      explicitArray: true
    });
    
    let result;
    try {
      result = await parser.parseStringPromise(response.data);
    } catch (xmlError: any) {
      // Jeśli błąd parsowania, spróbuj naprawić podstawowe problemy
      console.warn(`⚠️ XML parsing warning (${source}): ${xmlError.message}. Próbuję alternatywny parsing...`);
      
      // Czyść problematyczne znaczniki
      let cleanedXml = response.data
        .replace(/<\/[^>]*?>/g, (match: string) => match.toLowerCase()) // lowercase closing tags
        .replace(/<[^/>][^>]*?>/g, (match: string) => match.toLowerCase()); // lowercase opening tags
      
      result = await parser.parseStringPromise(cleanedXml);
    }

    const items = result.rss?.channel?.[0]?.item || [];
    const facts: LegalFact[] = [];

    for (const item of items) {
      const pubDate = item.pubdate?.[0] || item.date?.[0] || new Date().toISOString();
      let formattedDate: string;
      
      try {
        formattedDate = new Date(pubDate).toISOString().split('T')[0];
      } catch {
        formattedDate = new Date().toISOString().split('T')[0];
      }

      facts.push({
        id: `rss-${source}-${Date.now()}-${Math.random()}`,
        ingestMethod: 'rss',
        eliUri: null,
        title: item.title?.[0] || 'Brak tytułu',
        summary: item.description?.[0] || item.summary?.[0] || '',
        date: formattedDate,
        impact: 'medium',
        category: source.toUpperCase(),
        legalStatus: 'published',
        officialRationale: item.description?.[0] || item.summary?.[0] || '',
        sourceUrl: item.link?.[0] || item.guid?.[0] || url
      });
    }

    console.log(`✅ RSS ${source.toUpperCase()}: Pobrano ${facts.length} dokumentów`);
    return facts;
  } catch (error: any) {
    console.error(`❌ RSS Scraper Error (${source}):`, error.message || error);
    return [];
  }
}
