import axios from 'axios';
import * as cheerio from 'cheerio';
import { LegalFact } from '../types/index.js';

/**
 * Scraper dla komunikatów GUS
 */
export async function scrapeGUS(): Promise<LegalFact[]> {
  try {
    console.log('📊 Scraping GUS...');
    
    const response = await axios.get('https://stat.gov.pl/aktualnosci/', {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StraznikPrawa/1.0)'
      }
    });

    const $ = cheerio.load(response.data);
    const facts: LegalFact[] = [];

    // GUS używa listy artykułów
    $('.article-item, .news-item').slice(0, 20).each((_, item) => {
      try {
        const titleEl = $(item).find('h3, .title, a').first();
        const title = titleEl.text().trim();
        const link = titleEl.attr('href') || $(item).find('a').attr('href');
        const dateEl = $(item).find('.date, time, .publication-date').first();
        const dateStr = dateEl.text().trim();
        const summary = $(item).find('p, .summary').first().text().trim();

        if (title && link) {
          facts.push({
            id: `gus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ingestMethod: 'scraper',
            eliUri: null,
            title: `GUS: ${title}`,
            summary: summary || title,
            date: parseDateFromString(dateStr),
            impact: 'low',
            category: 'GUS',
            legalStatus: 'informational',
            officialRationale: summary,
            sourceUrl: link.startsWith('http') ? link : `https://stat.gov.pl${link}`
          });
        }
      } catch (err) {
        // Ignoruj błędy pojedynczych wpisów
      }
    });

    console.log(`✅ GUS: ${facts.length} komunikatów`);
    return facts;
  } catch (error) {
    console.error('❌ GUS Scraper Error:', error);
    return [];
  }
}

function parseDateFromString(str: string): string {
  // Próbuj sparsować datę z różnych formatów
  const dateMatch = str.match(/(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})/);
  if (dateMatch) {
    return `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
  }
  return new Date().toISOString().split('T')[0];
}
