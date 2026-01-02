import { LegalFact } from '../../types/index.js';

/**
 * Struktura ELI zgodna z ontologią europejską
 */
export interface ELIDocument {
  '@context'?: any;
  '@id': string;
  'eli:title'?: string;
  'eli:title_short'?: string;
  'eli:id_local'?: string;
  'eli:date_document'?: string;
  'eli:date_publication'?: string;
  'eli:type_document'?: string;
  'eli:is_about'?: string | string[];
  'eli:publisher'?: string;
  'eli:language'?: string;
  'eli:in_force'?: boolean | string;
  'eli:legal_value'?: string;
  'eli:description'?: string;
  'eli:number'?: string;
  'eli:passed_by'?: string;
}

/**
 * Parser uniwersalny dla różnych formatów ELI
 */
export class ELIParser {
  /**
   * Parsuj JSON-LD (najczęstszy format w Polsce)
   */
  static parseJsonLd(data: any, sourceId: string): LegalFact[] {
    const results: LegalFact[] = [];
    
    // Obsługa single document i array
    const docs: ELIDocument[] = Array.isArray(data) ? data : 
                                 data['@graph'] ? data['@graph'] :
                                 [data];

    for (const doc of docs) {
      try {
        const fact = this.convertEliToLegalFact(doc, sourceId);
        if (fact) results.push(fact);
      } catch (err) {
        console.warn(`⚠️ Błąd parsowania dokumentu ELI:`, err);
      }
    }

    return results;
  }

  /**
   * Konwertuj dokument ELI na LegalFact
   */
  private static convertEliToLegalFact(doc: ELIDocument, sourceId: string): LegalFact | null {
    const eliId = doc['@id'] || doc['eli:id_local'];
    if (!eliId) return null;

    const title = doc['eli:title'] || doc['eli:title_short'] || 'Brak tytułu';
    const date = doc['eli:date_publication'] || doc['eli:date_document'] || new Date().toISOString().split('T')[0];
    const type = doc['eli:type_document'] || 'unknown';
    const description = doc['eli:description'] || '';
    
    // Określ impact na podstawie typu dokumentu
    const impact = this.determineImpactFromType(type);
    
    // Wyciągnij kategorię
    const category = this.extractCategory(doc, sourceId);
    
    // Status prawny
    const inForce = doc['eli:in_force'];
    const legalStatus = typeof inForce === 'boolean' ? 
      (inForce ? 'in_force' : 'repealed') : 
      (inForce || 'unknown');

    return {
      id: `eli-${sourceId}-${this.sanitizeId(eliId)}`,
      ingestMethod: 'eli',
      eliUri: eliId,
      title: this.cleanText(title),
      summary: this.cleanText(description).substring(0, 500),
      date: this.parseDate(date),
      impact,
      category,
      legalStatus: String(legalStatus),
      officialRationale: this.cleanText(description),
      sourceUrl: eliId.startsWith('http') ? eliId : `https://isap.sejm.gov.pl${eliId}`
    };
  }

  /**
   * Określ wpływ na podstawie typu dokumentu
   */
  private static determineImpactFromType(type: string): 'low' | 'medium' | 'high' {
    const typeLower = type.toLowerCase();
    
    // Wysoki wpływ
    if (typeLower.includes('ustawa') || 
        typeLower.includes('konstytucja') ||
        typeLower.includes('act') ||
        typeLower.includes('constitution')) {
      return 'high';
    }
    
    // Średni wpływ
    if (typeLower.includes('rozporządzenie') ||
        typeLower.includes('decree') ||
        typeLower.includes('regulation')) {
      return 'medium';
    }
    
    // Niski wpływ
    return 'low';
  }

  /**
   * Wyciągnij kategorię z dokumentu ELI
   */
  private static extractCategory(doc: ELIDocument, sourceId: string): string {
    if (doc['eli:is_about']) {
      const about = Array.isArray(doc['eli:is_about']) ? 
        doc['eli:is_about'][0] : 
        doc['eli:is_about'];
      return String(about);
    }
    
    if (doc['eli:type_document']) {
      return String(doc['eli:type_document']);
    }
    
    return sourceId.toUpperCase();
  }

  /**
   * Parsuj datę (obsługa różnych formatów)
   */
  private static parseDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch {}
    
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Czyść tekst (usuń nadmiarowe białe znaki)
   */
  private static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }

  /**
   * Sanitize ID dla bezpieczeństwa
   */
  private static sanitizeId(id: string): string {
    return id
      .replace(/[^a-zA-Z0-9\-_\/]/g, '-')
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
  }

  /**
   * Parsuj RDF/XML (jeśli potrzebne)
   */
  static parseRdfXml(xml: string, sourceId: string): LegalFact[] {
    // TODO: Implementacja parsera RDF/XML (można użyć biblioteki rdflib.js)
    console.warn('⚠️ RDF/XML parser not implemented yet');
    return [];
  }

  /**
   * Parsuj Turtle (jeśli potrzebne)
   */
  static parseTurtle(ttl: string, sourceId: string): LegalFact[] {
    // TODO: Implementacja parsera Turtle
    console.warn('⚠️ Turtle parser not implemented yet');
    return [];
  }
}
