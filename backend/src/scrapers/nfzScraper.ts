import axios from 'axios';
import * as cheerio from 'cheerio';
import { LegalFact } from '../types/index.js';

/**
 * Scraper dla strony NFZ - Zarządzenia Prezesa
 */
export async function scrapeNFZ(): Promise<LegalFact[]> {
  try {
    console.log('🏥 Scraping NFZ...');
    
    const response = await axios.get('https://www.nfz.gov.pl/zarzadzenia-prezesa/', {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const facts: LegalFact[] = [];

    // NFZ używa konkretnej struktury tabelarycznej
    // Szukamy tabel z klasą .table lub w main content
    $('table tbody tr, .table-responsive tbody tr').each((_, row) => {
      try {
        const cells = $(row).find('td');
        if (cells.length < 2) return; // Pomiń puste wiersze

        // Kolumny: [Numer] [Tytuł/Data] [Link]
        const firstCell = $(cells[0]).text().trim();
        const secondCell = $(cells[1]).text().trim();
        
        // Wyodrębnij numer zarządzenia
        const numberMatch = firstCell.match(/(\d+\/\d+)/);
        if (!numberMatch) return;
        
        const number = numberMatch[1];
        const link = $(cells[1]).find('a').attr('href') || $(cells[0]).find('a').attr('href');
        
        // Wyciągnij datę (format DD.MM.YYYY)
        const dateMatch = secondCell.match(/(\d{2}\.\d{2}\.\d{4})/);
        const dateStr = dateMatch ? dateMatch[1] : '';
        
        // Tytuł (wszystko po numerze)
        const title = secondCell.replace(/^\d+\/\d+/, '').replace(/\d{2}\.\d{2}\.\d{4}/, '').trim();

        if (number && title) {
          facts.push({
            id: `nfz-${number.replace(/\//g, '-')}`,
            ingestMethod: 'scraper',
            eliUri: null,
            title: `Zarządzenie NFZ ${number}: ${title}`,
            summary: `Zarządzenie Prezesa Narodowego Funduszu Zdrowia nr ${number}`,
            date: parseNFZDate(dateStr),
            impact: 'medium',
            category: 'NFZ',
            legalStatus: 'published',
            officialRationale: title,
            sourceUrl: link ? (link.startsWith('http') ? link : `https://www.nfz.gov.pl${link}`) : 'https://www.nfz.gov.pl/zarzadzenia-prezesa/'
          });
        }
      } catch (rowError) {
        // Ignoruj błędy pojedynczych wierszy
      }
    });

    console.log(`✅ NFZ: ${facts.length} zarządzeń`);
    return facts;
  } catch (error) {
    console.error('❌ NFZ Scraper Error:', error);
    return [];
  }
}

/**
 * Parsuj datę NFZ (DD.MM.YYYY -> YYYY-MM-DD)
 */
function parseNFZDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return new Date().toISOString().split('T')[0];
}
