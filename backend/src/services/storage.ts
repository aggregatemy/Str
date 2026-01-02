import { getDatabase, runMigrations } from '../db/client';
import { DatabaseSchema, LegalUpdateRow } from '../db/schema';
import { logger } from '../utils/logger';
import { LegalUpdate } from '../types';

export class StorageService {
  private schema: DatabaseSchema;

  constructor() {
    const db = getDatabase();
    runMigrations();
    this.schema = new DatabaseSchema(db);
    logger.info('Storage Service initialized');
  }

  /**
   * Save a legal update to the database
   * @param update - Legal update to save
   * @returns Success status
   */
  async saveLegalUpdate(update: LegalUpdate): Promise<boolean> {
    try {
      logger.info('Saving legal update', { id: update.id });

      // Check if update already exists
      const existing = this.schema.getLegalUpdateById(update.id);
      if (existing) {
        logger.warn('Legal update already exists, skipping', { id: update.id });
        return false;
      }

      const row: Omit<LegalUpdateRow, 'created_at' | 'updated_at'> = {
        id: update.id,
        eli_uri: update.eliUri || null,
        ingest_method: update.ingestMethod,
        title: update.title,
        summary: update.summary,
        date: update.date,
        impact: update.impact,
        category: update.category,
        legal_status: update.legalStatus,
        official_rationale: update.officialRationale,
        source_url: update.sourceUrl || null,
        raw_data: update.rawData || null
      };

      this.schema.insertLegalUpdate(row);
      logger.info('Successfully saved legal update', { id: update.id });
      return true;
    } catch (error) {
      logger.error('Error saving legal update', { error, id: update.id });
      throw error;
    }
  }

  /**
   * Get legal updates with optional filters
   * @param options - Filter options
   * @returns Array of legal updates
   */
  async getLegalUpdates(options?: {
    range?: string;
    method?: string;
  }): Promise<LegalUpdate[]> {
    try {
      logger.info('Fetching legal updates', { options });

      const filters: any = {};

      if (options?.method) {
        filters.ingestMethod = options.method;
      }

      if (options?.range) {
        const now = new Date();
        let daysBack = 7;

        switch (options.range) {
          case '7d':
            daysBack = 7;
            break;
          case '30d':
            daysBack = 30;
            break;
          case '90d':
            daysBack = 90;
            break;
        }

        const dateFrom = new Date(now);
        dateFrom.setDate(dateFrom.getDate() - daysBack);
        filters.dateFrom = dateFrom.toISOString().split('T')[0];
      }

      const rows = this.schema.getAllLegalUpdates(filters);
      
      const updates: LegalUpdate[] = rows.map(row => ({
        id: row.id,
        eliUri: row.eli_uri || undefined,
        ingestMethod: row.ingest_method,
        title: row.title,
        summary: row.summary,
        date: row.date,
        impact: row.impact,
        category: row.category,
        legalStatus: row.legal_status,
        officialRationale: row.official_rationale,
        sourceUrl: row.source_url || undefined,
        rawData: row.raw_data || undefined
      }));

      logger.info(`Fetched ${updates.length} legal updates`);
      return updates;
    } catch (error) {
      logger.error('Error fetching legal updates', { error });
      throw error;
    }
  }

  /**
   * Get legal updates by IDs
   * @param ids - Array of update IDs
   * @returns Array of legal updates
   */
  async getLegalUpdatesByIds(ids: string[]): Promise<LegalUpdate[]> {
    try {
      logger.info('Fetching legal updates by IDs', { count: ids.length });

      const updates: LegalUpdate[] = [];

      for (const id of ids) {
        const row = this.schema.getLegalUpdateById(id);
        if (row) {
          updates.push({
            id: row.id,
            eliUri: row.eli_uri || undefined,
            ingestMethod: row.ingest_method,
            title: row.title,
            summary: row.summary,
            date: row.date,
            impact: row.impact,
            category: row.category,
            legalStatus: row.legal_status,
            officialRationale: row.official_rationale,
            sourceUrl: row.source_url || undefined,
            rawData: row.raw_data || undefined
          });
        }
      }

      logger.info(`Fetched ${updates.length} legal updates by IDs`);
      return updates;
    } catch (error) {
      logger.error('Error fetching legal updates by IDs', { error });
      throw error;
    }
  }

  /**
   * Save attachment for a legal update
   * @param updateId - ID of the legal update
   * @param filename - Name of the file
   * @param content - File content as Buffer
   * @param mimeType - MIME type of the file
   */
  async saveAttachment(
    updateId: string,
    filename: string,
    content: Buffer,
    mimeType?: string
  ): Promise<void> {
    try {
      logger.info('Saving attachment', { updateId, filename });

      this.schema.insertAttachment({
        legal_update_id: updateId,
        filename,
        content,
        mime_type: mimeType || null
      });

      logger.info('Successfully saved attachment', { updateId, filename });
    } catch (error) {
      logger.error('Error saving attachment', { error, updateId, filename });
      throw error;
    }
  }

  /**
   * Get attachments for a legal update
   * @param updateId - ID of the legal update
   * @returns Array of attachments
   */
  async getAttachments(updateId: string) {
    try {
      logger.info('Fetching attachments', { updateId });
      const attachments = this.schema.getAttachmentsByLegalUpdateId(updateId);
      logger.info(`Fetched ${attachments.length} attachments`);
      return attachments;
    } catch (error) {
      logger.error('Error fetching attachments', { error, updateId });
      throw error;
    }
  }
}
