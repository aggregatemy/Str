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
   */
  async fetchRecentDocuments(days: number = 30): Promise<LegalFact[]> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    
    return this.fetchDocuments({
      date_from: fromDate.toISOString().split('T')[0]
    });
  }
}
