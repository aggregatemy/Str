import cron from 'node-cron';
import { NFZScraper } from '../scrapers/nfz-scraper';
import { ELIClient } from '../scrapers/eli-client';
import { RSSClient } from '../scrapers/rss-client';
import { NormalizationService } from '../services/normalization';
import { StorageService } from '../services/storage';
import { DeduplicationService } from '../services/deduplication';
import { logger } from '../utils/logger';

/**
 * Start the hourly synchronization job
 * Runs every hour to fetch and process new legal updates
 */
export function startHourlySyncJob(): void {
  const cronSchedule = process.env.CRON_SCHEDULE || '0 * * * *'; // Default: every hour at :00
  const enableCron = process.env.ENABLE_CRON !== 'false';

  if (!enableCron) {
    logger.info('Cron jobs are disabled');
    return;
  }

  logger.info(`Scheduling hourly sync job with cron: ${cronSchedule}`);

  cron.schedule(cronSchedule, async () => {
    logger.info('Starting hourly sync job');
    
    try {
      await syncNFZDocuments();
      await syncELIDocuments();
      await syncRSSFeeds();
      
      logger.info('Hourly sync job completed successfully');
    } catch (error) {
      logger.error('Hourly sync job failed', { error });
    }
  });

  logger.info('Hourly sync job scheduled successfully');
}

/**
 * Sync NFZ documents
 */
async function syncNFZDocuments(): Promise<void> {
  try {
    logger.info('Syncing NFZ documents');
    
    const scraper = new NFZScraper();
    const normalization = new NormalizationService();
    const storage = new StorageService();
    const dedup = new DeduplicationService();

    // Fetch documents from last 24 hours
    const docs = await scraper.fetchRecentDocuments(24);
    logger.info(`Fetched ${docs.length} NFZ documents`);

    // Filter out duplicates
    const newDocs = await dedup.filterNew(docs);
    logger.info(`Found ${newDocs.length} new NFZ documents`);

    // Process each new document
    for (const doc of newDocs) {
      try {
        // Fetch details
        const details = await scraper.fetchDetails(doc.InstitutionId, doc.Id);
        
        // Normalize data
        const normalized = await normalization.normalizeNFZData({
          ...doc,
          ...details
        });
        
        // Save to database
        await storage.saveLegalUpdate(normalized);
        logger.info(`Saved NFZ document: ${normalized.id}`);

        // Download and save attachments if present
        if (details.Files && details.Files.length > 0) {
          for (const file of details.Files) {
            try {
              const content = await scraper.downloadAttachment(
                details.InstitutionId,
                file.Id,
                file.IsZipxAttachment
              );
              
              await storage.saveAttachment(
                normalized.id,
                file.Name,
                content,
                file.IsZipxAttachment ? 'application/zip' : 'application/octet-stream'
              );
              
              logger.info(`Saved attachment: ${file.Name}`);
            } catch (attachmentError) {
              logger.error('Error downloading attachment', { 
                error: attachmentError,
                fileId: file.Id 
              });
            }
          }
        }
      } catch (docError) {
        logger.error('Error processing NFZ document', { 
          error: docError,
          documentId: doc.Id 
        });
      }
    }

    logger.info(`NFZ sync completed: ${newDocs.length} new documents processed`);
  } catch (error) {
    logger.error('Error syncing NFZ documents', { error });
    throw error;
  }
}

/**
 * Sync ELI documents
 */
async function syncELIDocuments(): Promise<void> {
  try {
    logger.info('Syncing ELI documents');
    
    const client = new ELIClient();
    const normalization = new NormalizationService();
    const storage = new StorageService();
    const dedup = new DeduplicationService();

    // Fetch recent acts from last 7 days
    const docs = await client.fetchRecentActs(7);
    logger.info(`Fetched ${docs.length} ELI documents`);

    // Filter out duplicates
    const newDocs = await dedup.filterNew(docs);
    logger.info(`Found ${newDocs.length} new ELI documents`);

    // Process each new document
    for (const doc of newDocs) {
      try {
        const normalized = await normalization.normalizeELIData(doc);
        await storage.saveLegalUpdate(normalized);
        logger.info(`Saved ELI document: ${normalized.id}`);
      } catch (docError) {
        logger.error('Error processing ELI document', { 
          error: docError,
          documentId: doc.id 
        });
      }
    }

    logger.info(`ELI sync completed: ${newDocs.length} new documents processed`);
  } catch (error) {
    logger.error('Error syncing ELI documents', { error });
    throw error;
  }
}

/**
 * Sync RSS feeds
 */
async function syncRSSFeeds(): Promise<void> {
  try {
    logger.info('Syncing RSS feeds');
    
    const client = new RSSClient();
    const normalization = new NormalizationService();
    const storage = new StorageService();
    const dedup = new DeduplicationService();

    // Fetch from multiple RSS sources
    const zusItems = await client.fetchZUSFeed();
    const cezItems = await client.fetchCEZFeed();
    const allItems = [...zusItems, ...cezItems];
    
    logger.info(`Fetched ${allItems.length} RSS items`);

    // Filter out duplicates
    const newItems = await dedup.filterNew(allItems);
    logger.info(`Found ${newItems.length} new RSS items`);

    // Process each new item
    for (const item of newItems) {
      try {
        const normalized = await normalization.normalizeRSSData(item);
        await storage.saveLegalUpdate(normalized);
        logger.info(`Saved RSS item: ${normalized.id}`);
      } catch (itemError) {
        logger.error('Error processing RSS item', { 
          error: itemError,
          itemGuid: item.guid 
        });
      }
    }

    logger.info(`RSS sync completed: ${newItems.length} new items processed`);
  } catch (error) {
    logger.error('Error syncing RSS feeds', { error });
    throw error;
  }
}

/**
 * Run sync job immediately (for testing or manual trigger)
 */
export async function runSyncNow(): Promise<void> {
  logger.info('Running sync job immediately');
  
  try {
    await syncNFZDocuments();
    await syncELIDocuments();
    await syncRSSFeeds();
    
    logger.info('Manual sync completed successfully');
  } catch (error) {
    logger.error('Manual sync failed', { error });
    throw error;
  }
}
