import { Router, Request, Response } from 'express';
import { StorageService } from '../services/storage';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

const router = Router();

/**
 * POST /api/v1/export/extract
 * Generate plain text extract from selected legal updates
 */
router.post('/export/extract', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    // Validate request body
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('Invalid request body. "ids" must be a non-empty array', 400);
    }

    logger.info('POST /api/v1/export/extract', { count: ids.length });

    const storage = new StorageService();
    const updates = await storage.getLegalUpdatesByIds(ids);

    if (updates.length === 0) {
      throw new AppError('No updates found for the provided IDs', 404);
    }

    // Generate plain text extract
    const extract = updates.map(update => {
      const lines = [
        `DOKUMENT: ${update.title}`,
        `ID: ${update.id}`,
        `DATA: ${update.date}`,
        `KATEGORIA: ${update.category}`,
        `STATUS: ${update.legalStatus}`,
        `RANGA: ${update.impact}`,
        `ŹRÓDŁO: ${update.sourceUrl || 'brak'}`,
        ``,
        `STRESZCZENIE:`,
        update.summary,
        ``,
        `UZASADNIENIE:`,
        update.officialRationale,
        ``
      ];

      if (update.eliUri) {
        lines.splice(2, 0, `ELI URI: ${update.eliUri}`);
      }

      return lines.join('\n');
    }).join('\n---\n\n');

    logger.info(`Generated extract for ${updates.length} documents`);

    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(extract);
  } catch (error) {
    logger.error('Error in POST /api/v1/export/extract', { error });
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ 
        error: error.message 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to generate extract' 
      });
    }
  }
});

export default router;
