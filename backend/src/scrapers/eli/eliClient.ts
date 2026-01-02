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
  async fetchRecentDocuments(days: number = 30): Promise<LegalFact[]> {
    if (this.source.clientType === 'A') {
      return this.fetchClientA(days);
    } else {
      return this.fetchClientB(days);
    }
  }
  
  /**
   * KLIENT A: Sejm API (JSON)
   * Zapytanie bezpośrednie z parametrami
   */
  private async fetchClientA(days: number): Promise<LegalFact[]> {
    const currentYear = new Date().getFullYear();
    const allFacts: LegalFact[] = [];
    
    console.log(`📡 Klient A (Sejm): ${this.source.name}, rok ${currentYear}`);
    
    // Iteruj przez pozycje 1-100 dla bieżącego roku
    for (let pos = 1; pos <= 100; pos++) {
      try {
        const url = `${this.source.apiEndpoint}/${currentYear}/${pos}`;
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'StraznikPrawa/2.0'
          },
          validateStatus: (status) => status === 200
        });
        
        // Parsuj odpowiedź JSON
        const fact = this.parseClientAResponse(response.data, pos);
        if (fact) allFacts.push(fact);
        
        // Rate limiting
        await this.delay(100);
        
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Koniec dostępnych pozycji
          break;
        }
        // Ignoruj inne błędy i kontynuuj
      }
    }
    
    console.log(`✅ ${this.source.name}: ${allFacts.length} dokumentów`);
    return allFacts;
  }
  
  /**
   * KLIENT B: Ministerstwa (XML)
   * Brute-force przez pozycje aż do 404
   */
  private async fetchClientB(days: number): Promise<LegalFact[]> {
    const currentYear = new Date().getFullYear();
    const allFacts: LegalFact[] = [];
    
    console.log(`📡 Klient B (Resortowe): ${this.source.name}, ${this.source.dziennikId}`);
    
    // Iteruj przez pozycje 1-50 (ministerstwa publikują rzadziej)
    for (let pos = 1; pos <= 50; pos++) {
      try {
        // Format: https://dziennikmz.mz.gov.pl/api/eli/acts/DUM_MZ/2024/5/ogl/wiza/pol/xml
        const url = `${this.source.apiEndpoint}/${this.source.dziennikId}/${currentYear}/${pos}/ogl/wiza/pol/xml`;
        
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'Accept': 'application/xml, text/xml',
            'User-Agent': 'StraznikPrawa/2.0'
          },
          validateStatus: (status) => status === 200
        });
        
        // Parsuj XML
        const fact = this.parseClientBResponse(response.data, pos);
        if (fact) allFacts.push(fact);
        
        // Rate limiting (ważniejsze dla serwerów resortowych)
        await this.delay(150);
        
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Koniec dostępnych pozycji
          break;
        }
        // Ignoruj inne błędy
      }
    }
    
    console.log(`✅ ${this.source.name}: ${allFacts.length} dokumentów`);
    return allFacts;
  }
  
  /**
   * Parsuj odpowiedź z Klienta A (Sejm JSON)
   */
  private parseClientAResponse(data: any, position: number): LegalFact | null {
    if (!data || !data.title) return null;
    
    const eliUri = data.ELI || `${this.source.baseUrl}/eli/acts/${this.source.dziennikId}/${data.year || new Date().getFullYear()}/${position}`;
    
    return {
      id: `${this.source.id}-${data.year || new Date().getFullYear()}-${position}`,
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
  private parseClientBResponse(xmlData: string, position: number): LegalFact | null {
    try {
      // Prosta ekstrakcja z XML (można rozbudować)
      const titleMatch = xmlData.match(/<title[^>]*>(.*?)<\/title>/i);
      const dateMatch = xmlData.match(/<date[^>]*>(.*?)<\/date>/i) || 
                       xmlData.match(/<publicationDate[^>]*>(.*?)<\/publicationDate>/i);
      
      if (!titleMatch) return null;
      
      const currentYear = new Date().getFullYear();
      const eliUri = `${this.source.baseUrl}/eli/acts/${this.source.dziennikId}/${currentYear}/${position}`;
      
      return {
        id: `${this.source.id}-${currentYear}-${position}`,
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
