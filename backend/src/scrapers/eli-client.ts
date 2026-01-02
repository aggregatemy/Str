import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';
import { ELIDocument } from '../types';

export class ELIClient {
  private client: AxiosInstance;
  private baseUrl = 'https://isap.sejm.gov.pl/api/eli';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    logger.info('ELI Client initialized');
  }

  /**
   * Search for legal acts using ISAP ELI API
   * @param query - Search query parameters
   * @returns Array of ELI documents
   */
  async searchActs(query: {
    year?: number;
    type?: string;
    number?: string;
    [key: string]: any;
  }): Promise<ELIDocument[]> {
    try {
      logger.info('Searching ELI acts', { query });
      
      // Build query string
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const response = await this.client.get('/search', { params });
      const documents = response.data?.items || [];
      
      logger.info(`Found ${documents.length} ELI documents`);
      return documents;
    } catch (error) {
      logger.error('Error searching ELI acts', { error });
      throw error;
    }
  }

  /**
   * Fetch a specific document by ELI URI
   * @param eliUri - ELI URI of the document
   * @returns Document details
   */
  async fetchByUri(eliUri: string): Promise<ELIDocument> {
    try {
      logger.info('Fetching ELI document by URI', { eliUri });
      
      const response = await this.client.get(`/document`, {
        params: { uri: eliUri }
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching ELI document by URI', { error, eliUri });
      throw error;
    }
  }

  /**
   * Fetch recent legal acts published in the last N days
   * @param days - Number of days to look back
   * @returns Array of recent documents
   */
  async fetchRecentActs(days: number = 7): Promise<ELIDocument[]> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    try {
      return await this.searchActs({
        dateFrom: dateFrom.toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      logger.error('Error fetching recent ELI acts', { error });
      return [];
    }
  }

  /**
   * Fetch healthcare-related acts
   * @returns Array of healthcare-related documents
   */
  async fetchHealthcareActs(): Promise<ELIDocument[]> {
    try {
      return await this.searchActs({
        keywords: 'zdrowie,NFZ,ochrona zdrowia,świadczenia zdrowotne'
      });
    } catch (error) {
      logger.error('Error fetching healthcare ELI acts', { error });
      return [];
    }
  }
}
