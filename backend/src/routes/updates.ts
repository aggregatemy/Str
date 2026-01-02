import { Router, Request, Response } from 'express';
import { StorageService } from '../services/storage';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

const router = Router();

/**
 * GET /api/v1/updates
 * Fetch normalized legal updates with optional filters
 */
router.get('/updates', async (req: Request, res: Response) => {
  try {
    const { range, method } = req.query;

    // Validate range parameter
    if (range && !['7d', '30d', '90d'].includes(range as string)) {
      throw new AppError('Invalid range parameter. Must be one of: 7d, 30d, 90d', 400);
    }

    // Validate method parameter
    if (method && !['eli', 'rss', 'scraper'].includes(method as string)) {
      throw new AppError('Invalid method parameter. Must be one of: eli, rss, scraper', 400);
    }

    logger.info('GET /api/v1/updates', { range, method });

    const storage = new StorageService();
    const updates = await storage.getLegalUpdates({
      range: range as string | undefined,
      method: method as string | undefined
    });

    // Transform to match OpenAPI schema (camelCase)
    const response = updates.map(update => ({
      id: update.id,
      eliUri: update.eliUri,
      ingestMethod: update.ingestMethod,
      title: update.title,
      summary: update.summary,
      date: update.date,
      impact: update.impact,
      category: update.category,
      legalStatus: update.legalStatus,
      officialRationale: update.officialRationale,
      sourceUrl: update.sourceUrl
    }));

    logger.info(`Returning ${response.length} legal updates`);
    res.json(response);
  } catch (error) {
    logger.error('Error in GET /api/v1/updates', { error });
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ 
        error: error.message 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch updates' 
      });
    }
  }
});

export default router;
