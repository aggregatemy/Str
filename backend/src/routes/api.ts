import express from 'express';
import { getData, getExport } from '../services/dataService.js';

const router = express.Router();

router.get('/updates', async (req, res) => {
  try {
    const { range, method } = req.query;
    const data = await getData(range as string, method as string);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/export/extract', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids must be an array' });
    }
    
    const textExport = await getExport(ids);
    res.type('text/plain').send(textExport);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
