import axios from 'axios';
import * as cheerio from 'cheerio';
import { LegalFact } from '../types/index.js';

export async function scrapeNFZ(): Promise<LegalFact[]> {
  try {
    const response = await axios.get('https://www.nfz.gov.pl/zarzadzenia-prezesa/', {
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const facts: LegalFact[] = [];

    $('table tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 3) return;

      const number = $(cells[0]).text().trim();
      const title = $(cells[1]).text().trim();
      const date = $(cells[2]).text().trim();
      const link = $(cells[1]).find('a').attr('href');

      if (number && title) {
        facts.push({
          id: `nfz-${number.replace(/\//g, '-')}`,
          ingestMethod: 'scraper',
          eliUri: null,
          title: `Zarządzenie ${number}: ${title}`,
          summary: title,
          date: parseNFZDate(date),
          impact: 'medium',
          category: 'NFZ',
          legalStatus: 'published',
          officialRationale: '',
          sourceUrl: link ? `https://www.nfz.gov.pl${link}` : 'https://www.nfz.gov.pl/zarzadzenia-prezesa/'
        });
      }
    });

    return facts;
  } catch (error) {
    console.error('❌ NFZ Scraper Error:', error);
    return [];
  }
}

function parseNFZDate(dateStr: string): string {
  // Format: "DD.MM.YYYY" -> "YYYY-MM-DD"
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return new Date().toISOString().split('T')[0];
}
