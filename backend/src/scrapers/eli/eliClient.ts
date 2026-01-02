import axios, { AxiosRequestConfig } from 'axios';
import { ELISource } from '../../config/eliSources.js';
import { ELIParser } from './eliParser.js';
import { LegalFact } from '../../types/index.js';

/**
 * Uniwersalny klient ELI
 */
export class ELIClient {
  private source: ELISource;
  private timeout: number = 30000; // 30 sekund

  constructor(source: ELISource) {
    this.source = source;
  }

  /**
   * Pobierz dokumenty z endpointu ELI
   */
  async fetchDocuments(params?: Record<string, any>): Promise<LegalFact[]> {
    try {
      console.log(`📡 ELI: Pobieranie z ${this.source.name}...`);

      const config: AxiosRequestConfig = {
        timeout: this.timeout,
        headers: {
          'Accept': this.getAcceptHeader(),
          'User-Agent': 'StraznikPrawa/2.0 (ELI Client)'
        },
        params: {
          limit: 100, // Domyślny limit
          ...params
        }
      };

      const response = await axios.get(this.source.apiEndpoint, config);
      
      // Parsuj odpowiedź w zależności od formatu
      const facts = this.parseResponse(response.data);
      
      console.log(`✅ ${this.source.name}: ${facts.length} dokumentów`);
      return facts;

    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        console.error(`⏱️ Timeout: ${this.source.name}`);
      } else if (error.response) {
        console.error(`❌ HTTP ${error.response.status}: ${this.source.name}`);
      } else {
        console.error(`❌ Błąd połączenia: ${this.source.name}`, error.message);
      }
      return [];
    }
  }

  /**
   * Określ nagłówek Accept na podstawie formatu
   */
  private getAcceptHeader(): string {
    switch (this.source.format) {
      case 'json-ld':
        return 'application/ld+json, application/json';
      case 'rdf-xml':
        return 'application/rdf+xml, application/xml';
      case 'turtle':
        return 'text/turtle, text/plain';
      case 'auto':
      default:
        return 'application/ld+json, application/json, application/rdf+xml, text/turtle';
    }
  }

  /**
   * Parsuj odpowiedź w zależności od typu zawartości
   */
  private parseResponse(data: any): LegalFact[] {
    // JSON-LD (najczęstszy)
    if (typeof data === 'object') {
      return ELIParser.parseJsonLd(data, this.source.id);
    }

    // RDF/XML lub Turtle (jako string)
    if (typeof data === 'string') {
      if (data.trim().startsWith('<')) {
        return ELIParser.parseRdfXml(data, this.source.id);
      } else {
        return ELIParser.parseTurtle(data, this.source.id);
      }
    }

    return [];
  }

  /**
   * Pobierz dokumenty z ostatnich N dni
   * Obsługuje dwa typy klientów:
   * - A (Sejm): Direct API query
   * - B (Resortowe): Brute-force przez pozycje
   */
  async fetchRecentDocuments(days: number = 120): Promise<LegalFact[]> {
    if (this.source.clientType === 'A') {
      return this.fetchClientA(days);
    } else {
      return this.fetchClientB(days);
    }
  }
  
  /**
   * KLIENT A: Sejm API (JSON)
   * Pobieranie z ostatniego miesiąca (grudzień 2025 + styczeń 2026)
   */
  private async fetchClientA(days: number): Promise<LegalFact[]> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const previousYear = currentYear - 1;
    const allFacts: LegalFact[] = [];
    
    // Pobierz z poprzedniego roku (cały 2025 - pozycje 1-150)
    console.log(`📡 Klient A (Sejm): ${this.source.name}, rok ${previousYear}`);
    const previousYearFacts = await this.fetchYearPositions(previousYear, 1, 150);
    allFacts.push(...previousYearFacts);
    
    // Pobierz z bieżącego roku (2026 - pozycje 1-150)
    console.log(`📡 Klient A (Sejm): ${this.source.name}, rok ${currentYear}`);
    const currentYearFacts = await this.fetchYearPositions(currentYear, 1, 150);
    allFacts.push(...currentYearFacts);
    
    console.log(`✅ ${this.source.name}: ${allFacts.length} dokumentów`);
    return allFacts;
  }
  
  /**
   * Pobierz pozycje dla konkretnego roku
   */
  private async fetchYearPositions(year: number, startPos: number, maxPos: number): Promise<LegalFact[]> {
    const facts: LegalFact[] = [];
    
    for (let pos = startPos; pos <= maxPos; pos++) {
      try {
        const url = `${this.source.apiEndpoint}/${year}/${pos}`;
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'StraznikPrawa/2.0'
          },
          validateStatus: (status) => status === 200
        });
        
        // Parsuj odpowiedź JSON
        const fact = this.parseClientAResponse(response.data, pos, year);
        if (fact) {
          facts.push(fact);
          // Debug: pokaż pierwsze 3 pozycje
          if (pos <= 3) {
            console.log(`  ✓ ${year}/${pos}: ${fact.title.substring(0, 60)}...`);
          }
        }
        
        // Rate limiting
        await this.delay(100);
        
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Koniec dostępnych pozycji dla tego roku
          console.log(`  └─ Koniec pozycji dla ${year} (404 na pozycji ${pos})`);
          break;
        }
        // Debug: pokaż inne błędy dla pierwszych pozycji
        if (pos <= 3) {
          console.log(`  ⚠ ${year}/${pos}: ${err.message}`);
        }
        // Ignoruj inne błędy i kontynuuj
      }
    }
    
    console.log(`  📊 Rok ${year}: ${facts.length} dokumentów`);
    return facts;
  }
  
  /**
   * KLIENT B: Ministerstwa (XML)
   * Pobieranie z ostatniego miesiąca (grudzień 2025 + styczeń 2026)
   */
  private async fetchClientB(days: number): Promise<LegalFact[]> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const previousYear = currentYear - 1;
    const allFacts: LegalFact[] = [];
    
    console.log(`📡 Klient B (Resortowe): ${this.source.name}, ${this.source.dziennikId}`);
    
    // Pobierz z poprzedniego roku (cały 2025 - pozycje 1-80)
    const previousYearFacts = await this.fetchMinistryYearPositions(previousYear, 1, 80);
    allFacts.push(...previousYearFacts);
    
    // Pobierz z bieżącego roku (2026 - pozycje 1-80)
    const currentYearFacts = await this.fetchMinistryYearPositions(currentYear, 1, 80);
    allFacts.push(...currentYearFacts);
    
    console.log(`✅ ${this.source.name}: ${allFacts.length} dokumentów`);
    return allFacts;
  }
  
  /**
   * Pobierz pozycje ministerstwa dla konkretnego roku
   */
  private async fetchMinistryYearPositions(year: number, startPos: number, maxPos: number): Promise<LegalFact[]> {
    const facts: LegalFact[] = [];
    
    // Iteruj przez pozycje 1-50 (ministerstwa publikują rzadziej)
    for (let pos = startPos; pos <= maxPos; pos++) {
      try {
        // Format: https://dziennikmz.mz.gov.pl/api/eli/acts/DUM_MZ/2024/5/ogl/wiza/pol/xml
        const url = `${this.source.apiEndpoint}/${this.source.dziennikId}/${year}/${pos}/ogl/wiza/pol/xml`;
        
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'Accept': 'application/xml, text/xml',
            'User-Agent': 'StraznikPrawa/2.0'
          },
          validateStatus: (status) => status === 200
        });
        
        // Parsuj XML
        const fact = this.parseClientBResponse(response.data, pos, year);
        if (fact) facts.push(fact);
        
        // Rate limiting (ważniejsze dla serwerów resortowych)
        await this.delay(150);
        
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Koniec dostępnych pozycji dla tego roku
          break;
        }
        // Ignoruj inne błędy
      }
    }
    
    return facts;
  }
  
  /**
   * Parsuj odpowiedź z Klienta A (Sejm JSON)
   */
  private parseClientAResponse(data: any, position: number, year: number): LegalFact | null {
    if (!data || !data.title) return null;
    
    const eliUri = data.ELI || `${this.source.baseUrl}/eli/acts/${this.source.dziennikId}/${year}/${position}`;
    
    return {
      id: `${this.source.id}-${year}-${position}`,
      ingestMethod: 'eli',
      eliUri,
      title: data.title || 'Brak tytułu',
      summary: data.annotation || data.title,
      date: data.publicationDate || data.announcementDate || new Date().toISOString().split('T')[0],
      impact: this.determineImpact(data.title),
      category: this.source.category,
      legalStatus: data.status || 'published',
      officialRationale: data.annotation || '',
      sourceUrl: eliUri
    };
  }
  
  /**
   * Parsuj odpowiedź z Klienta B (Ministerstwa XML)
   */
  private parseClientBResponse(xmlData: string, position: number, year: number): LegalFact | null {
    try {
      // Prosta ekstrakcja z XML (można rozbudować)
      const titleMatch = xmlData.match(/<title[^>]*>(.*?)<\/title>/i);
      const dateMatch = xmlData.match(/<date[^>]*>(.*?)<\/date>/i) || 
                       xmlData.match(/<publicationDate[^>]*>(.*?)<\/publicationDate>/i);
      
      if (!titleMatch) return null;
      
      const eliUri = `${this.source.baseUrl}/eli/acts/${this.source.dziennikId}/${year}/${position}`;
      
      return {
        id: `${this.source.id}-${year}-${position}`,
        ingestMethod: 'eli',
        eliUri,
        title: titleMatch[1].replace(/<[^>]*>/g, '').trim(),
        summary: titleMatch[1].replace(/<[^>]*>/g, '').trim().substring(0, 200),
        date: dateMatch ? dateMatch[1].trim() : new Date().toISOString().split('T')[0],
        impact: 'medium',
        category: this.source.category,
        legalStatus: 'published',
        officialRationale: '',
        sourceUrl: eliUri
      };
    } catch (err) {
      console.error(`⚠️ Błąd parsowania XML (${this.source.id}, poz. ${position}):`, err);
      return null;
    }
  }
  
  /**
   * Określ wpływ na podstawie tytułu
   */
  private determineImpact(title: string): 'low' | 'medium' | 'high' {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('ustawa')) return 'high';
    if (titleLower.includes('rozporządzenie')) return 'medium';
    return 'low';
  }
  
  /**
   * Opóźnienie (rate limiting)
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
