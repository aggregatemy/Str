// Adapter based on project: https://github.com/Frankoslaw/nfz-baw-scrapper
// Original author: Franek Łopuszański
// License: MIT compatibility
// Adapted from Python to TypeScript with modifications

import axios, { AxiosInstance } from 'axios';
import { setupCache } from 'axios-cache-interceptor';
import { logger } from '../utils/logger';
import { NFZDocument, NFZDocumentDetails } from '../types';

export class NFZScraper {
  private client: AxiosInstance;
  private baseUrl = 'https://baw.nfz.gov.pl/api';

  constructor() {
    const axiosInstance = axios.create({ 
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Setup cache with 120 second TTL
    this.client = setupCache(axiosInstance, { 
      ttl: 120000,
      interpretHeader: false
    });
    
    logger.info('NFZ Scraper initialized');
  }

  /**
   * Fetch documents from NFZ BAW API
   * @param filters - Search filters for documents
   * @returns Array of NFZ documents
   */
  async fetchDocuments(filters: {
    pageNumber?: number;
    pageSize?: number;
    SearchForType?: number;
    InstitutionId?: number;
    [key: string]: any;
  }): Promise<NFZDocument[]> {
    try {
      logger.info('Fetching NFZ documents', { filters });
      
      const response = await this.client.post('/documents/GetDocumentsNewGrid', {
        pageNumber: 0,
        pageSize: 50,
        ...filters
      });

      const documents = response.data?.DevExtremeDocuments?.data || [];
      logger.info(`Fetched ${documents.length} documents from NFZ`);
      
      return documents;
    } catch (error) {
      logger.error('Error fetching NFZ documents', { error });
      throw error;
    }
  }

  /**
   * Fetch detailed information about a specific document
   * @param institutionId - ID of the institution
   * @param documentId - ID of the document
   * @returns Document details
   */
  async fetchDetails(institutionId: number, documentId: number): Promise<NFZDocumentDetails> {
    try {
      logger.info('Fetching NFZ document details', { institutionId, documentId });
      
      const response = await this.client.get(
        `/documents/${institutionId}/details/${documentId}/null`
      );

      return response.data;
    } catch (error) {
      logger.error('Error fetching NFZ document details', { error, institutionId, documentId });
      throw error;
    }
  }

  /**
   * Download attachment file from NFZ
   * @param institutionId - ID of the institution
   * @param fileId - ID of the file
   * @param isZipx - Whether the file is a ZIPX attachment
   * @returns File content as Buffer
   */
  async downloadAttachment(
    institutionId: number, 
    fileId: number, 
    isZipx: boolean
  ): Promise<Buffer> {
    try {
      const endpoint = isZipx ? 'GetZipxAttachment' : 'GetAttachment';
      logger.info('Downloading NFZ attachment', { institutionId, fileId, isZipx });
      
      const response = await this.client.get(
        `/file/${endpoint}/${institutionId}/${fileId}`,
        { responseType: 'arraybuffer' }
      );

      return Buffer.from(response.data);
    } catch (error) {
      logger.error('Error downloading NFZ attachment', { error, institutionId, fileId });
      throw error;
    }
  }

  /**
   * Fetch recent documents from the last N hours
   * @param hours - Number of hours to look back
   * @returns Array of recent documents
   */
  async fetchRecentDocuments(hours: number = 24): Promise<NFZDocument[]> {
    const dateFrom = new Date();
    dateFrom.setHours(dateFrom.getHours() - hours);
    
    return this.fetchDocuments({
      pageNumber: 0,
      pageSize: 100,
      SearchForType: 22, // Document type for zarządzenia
      InstitutionId: 4   // NFZ Central
    });
  }
}
