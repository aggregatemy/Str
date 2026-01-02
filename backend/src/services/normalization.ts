import { logger } from '../utils/logger';
import { LegalUpdate } from '../types';

export class NormalizationService {
  constructor() {
    logger.info('Normalization Service initialized');
  }

  /**
   * Normalize NFZ data to LegalUpdate format
   * Direct 1:1 mapping without AI interpretation
   * @param rawData - Raw NFZ document data
   * @returns Normalized LegalUpdate object
   */
  async normalizeNFZData(rawData: any): Promise<LegalUpdate> {
    try {
      logger.info('Normalizing NFZ data', { documentId: rawData.Id });

      // Direct 1:1 mapping without AI interpretation
      const legalUpdate: LegalUpdate = {
        id: `nfz-${rawData.Id}`,
        ingestMethod: 'scraper',
        title: rawData.Title || rawData.Name || 'Bez tytułu',
        summary: rawData.Subject || rawData.Title || 'Brak opisu',
        date: this.normalizeDate(rawData.Date),
        impact: this.determineImpactFromNFZType(rawData.Type),
        category: rawData.Type || 'Zarządzenie',
        legalStatus: 'obowiązujący',
        officialRationale: rawData.Subject || 'Brak danych źródłowych',
        sourceUrl: `https://baw.nfz.gov.pl/`,
        rawData: JSON.stringify(rawData)
      };

      logger.info('Successfully normalized NFZ data', { id: legalUpdate.id });
      return legalUpdate;
    } catch (error) {
      logger.error('Error normalizing NFZ data', { error });
      throw error;
    }
  }

  /**
   * Normalize date string to YYYY-MM-DD format
   * @param dateStr - Date string in various formats
   * @returns Normalized date string
   */
  private normalizeDate(dateStr: string | undefined): string {
    if (!dateStr) {
      return new Date().toISOString().split('T')[0];
    }

    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Determine impact level from NFZ document type
   * @param type - NFZ document type
   * @returns Impact level
   */
  private determineImpactFromNFZType(type: string | undefined): 'low' | 'medium' | 'high' {
    if (!type) return 'medium';
    
    const typeLower = type.toLowerCase();
    
    // NFZ documents are typically medium impact
    if (typeLower.includes('zarządzenie')) {
      return 'medium';
    }
    
    return 'medium';
  }

  /**
   * Normalize ELI data to LegalUpdate format
   * Direct 1:1 mapping without AI interpretation
   * @param rawData - Raw ELI document data
   * @returns Normalized LegalUpdate object
   */
  async normalizeELIData(rawData: any): Promise<LegalUpdate> {
    try {
      logger.info('Normalizing ELI data', { eliUri: rawData.uri });

      const legalUpdate: LegalUpdate = {
        id: rawData.id || rawData.uri?.replace(/[:/]/g, '-') || `eli-${Date.now()}`,
        eliUri: rawData.uri,
        ingestMethod: 'eli',
        title: rawData.title || 'Bez tytułu',
        summary: rawData.description || rawData.title || 'Brak opisu',
        date: rawData.date || new Date().toISOString().split('T')[0],
        impact: this.determineImpactFromType(rawData.type),
        category: rawData.type || 'Akt prawny',
        legalStatus: rawData.status || 'obowiązujący',
        officialRationale: rawData.rationale || 'Brak danych źródłowych',
        sourceUrl: rawData.uri || 'https://isap.sejm.gov.pl',
        rawData: JSON.stringify(rawData)
      };

      logger.info('Successfully normalized ELI data', { id: legalUpdate.id });
      return legalUpdate;
    } catch (error) {
      logger.error('Error normalizing ELI data', { error });
      throw error;
    }
  }

  /**
   * Normalize RSS data to LegalUpdate format
   * Direct 1:1 mapping without AI interpretation
   * @param rawData - Raw RSS item data
   * @returns Normalized LegalUpdate object
   */
  async normalizeRSSData(rawData: any): Promise<LegalUpdate> {
    try {
      logger.info('Normalizing RSS data', { guid: rawData.guid });

      const legalUpdate: LegalUpdate = {
        id: rawData.guid || rawData.link?.replace(/[:/]/g, '-') || `rss-${Date.now()}`,
        ingestMethod: 'rss',
        title: rawData.title || 'Bez tytułu',
        summary: rawData.description || rawData.title || 'Brak opisu',
        date: rawData.pubDate ? new Date(rawData.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        impact: 'low',
        category: 'Komunikat',
        legalStatus: 'informacyjny',
        officialRationale: rawData.description || 'Brak danych źródłowych',
        sourceUrl: rawData.link || '',
        rawData: JSON.stringify(rawData)
      };

      logger.info('Successfully normalized RSS data', { id: legalUpdate.id });
      return legalUpdate;
    } catch (error) {
      logger.error('Error normalizing RSS data', { error });
      throw error;
    }
  }

  /**
   * Determine impact level based on document type
   * @param type - Document type
   * @returns Impact level
   */
  private determineImpactFromType(type: string): 'low' | 'medium' | 'high' {
    if (!type) return 'medium';
    
    const typeLower = type.toLowerCase();
    
    if (typeLower.includes('ustawa') || typeLower.includes('konstytucja')) {
      return 'high';
    } else if (typeLower.includes('rozporządzenie') || typeLower.includes('zarządzenie')) {
      return 'medium';
    }
    
    return 'low';
  }
}
