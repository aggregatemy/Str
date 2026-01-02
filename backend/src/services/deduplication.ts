import { getDatabase } from '../db/client';
import { DatabaseSchema } from '../db/schema';
import { logger } from '../utils/logger';

export class DeduplicationService {
  private schema: DatabaseSchema;

  constructor() {
    const db = getDatabase();
    this.schema = new DatabaseSchema(db);
    logger.info('Deduplication Service initialized');
  }

  /**
   * Check if a document already exists in the database
   * @param id - Document ID
   * @returns True if document exists
   */
  exists(id: string): boolean {
    try {
      const existing = this.schema.getLegalUpdateById(id);
      return !!existing;
    } catch (error) {
      logger.error('Error checking document existence', { error, id });
      return false;
    }
  }

  /**
   * Filter out documents that already exist in the database
   * @param documents - Array of documents with Id field
   * @returns Array of new documents
   */
  async filterNew<T extends { Id?: number; id?: string; guid?: string }>(
    documents: T[]
  ): Promise<T[]> {
    try {
      logger.info('Filtering new documents', { total: documents.length });

      const newDocuments = documents.filter(doc => {
        // Generate ID based on document type
        let id: string;
        
        if (doc.Id !== undefined) {
          // NFZ document
          id = `nfz-${doc.Id}`;
        } else if (doc.id) {
          // ELI or other document with id
          id = doc.id;
        } else if (doc.guid) {
          // RSS document
          id = doc.guid;
        } else {
          // Fallback: consider as new if no ID found
          return true;
        }

        const exists = this.exists(id);
        return !exists;
      });

      logger.info('Filtered documents', { 
        total: documents.length, 
        new: newDocuments.length,
        duplicates: documents.length - newDocuments.length
      });

      return newDocuments;
    } catch (error) {
      logger.error('Error filtering new documents', { error });
      return documents; // Return all documents on error to avoid data loss
    }
  }

  /**
   * Filter out documents by IDs that already exist
   * @param ids - Array of document IDs
   * @returns Array of new IDs
   */
  filterNewIds(ids: string[]): string[] {
    try {
      logger.info('Filtering new IDs', { total: ids.length });

      const newIds = ids.filter(id => !this.exists(id));

      logger.info('Filtered IDs', { 
        total: ids.length, 
        new: newIds.length,
        duplicates: ids.length - newIds.length
      });

      return newIds;
    } catch (error) {
      logger.error('Error filtering new IDs', { error });
      return ids;
    }
  }

  /**
   * Get duplicate count for a time period
   * @param hours - Number of hours to check
   * @returns Number of duplicates detected
   */
  async getDuplicateStats(hours: number = 24): Promise<{
    checked: number;
    duplicates: number;
    new: number;
  }> {
    // This is a placeholder for statistics tracking
    // In production, you might want to track these in a separate table
    return {
      checked: 0,
      duplicates: 0,
      new: 0
    };
  }
}
