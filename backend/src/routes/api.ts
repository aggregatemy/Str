import express from 'express';
import { getData, getExport } from '../services/dataService.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/updates:
 *   get:
 *     summary: Pobierz akty prawne
 *     description: Zwraca listę aktów prawnych z bazy danych, z możliwością filtrowania po dacie i metodzie ingestii
 *     tags: [Updates]
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *         description: Zakres czasowy (7, 30 lub 90 dni)
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [eli, rss, scraper]
 *         description: Metoda ingestii danych
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *         description: Konkretne źródło (np. 'eli-sejm-du', 'eli-mz')
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Konkretna data (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lista aktów prawnych
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "eli-sejm-du-2025-1"
 *                   ingestMethod:
 *                     type: string
 *                     enum: [eli, rss, scraper]
 *                     example: "eli"
 *                   eliUri:
 *                     type: string
 *                     example: "https://api.sejm.gov.pl/eli/acts/DU/2025/1"
 *                   title:
 *                     type: string
 *                     example: "Rozporządzenie Ministra Zdrowia z dnia 19 grudnia 2024 r."
 *                   summary:
 *                     type: string
 *                     example: "Zmiana rozporządzenia w sprawie świadczeń gwarantowanych"
 *                   date:
 *                     type: string
 *                     format: date
 *                     example: "2025-01-02"
 *                   impact:
 *                     type: string
 *                     enum: [low, medium, high]
 *                     example: "medium"
 *                   category:
 *                     type: string
 *                     example: "Zdrowie"
 *                   legalStatus:
 *                     type: string
 *                     example: "published"
 *                   officialRationale:
 *                     type: string
 *                     example: "Dostosowanie przepisów do nowych wymogów"
 *                   sourceUrl:
 *                     type: string
 *                     example: "https://api.sejm.gov.pl/eli/acts/DU/2025/1"
 *       500:
 *         description: Błąd serwera
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *  */
router.get('/updates', async (req, res) => {
  const timestamp = new Date().toISOString();
  try {
    const rangeParam = req.query.range as string;
    const methodParam = req.query.method as string;
    const dateParam = req.query.date as string;
    console.log(`📊 [${timestamp}] Pobieranie updates: range=${rangeParam}, method=${methodParam}, date=${dateParam}`);
    
    // Pass undefined for source, and dateParam as 4th argument
    const data = await getData(rangeParam, methodParam, undefined, dateParam);
    
    console.log(`✅ [${timestamp}] Zwracam ${data.length} rekordów`);
    res.json(data);
  } catch (error: any) {
    console.error(`❌ [${timestamp}] Błąd /updates:`, error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp 
    });
  }
});

/**
 * @swagger
 * /api/v1/export/extract:
 *   post:
 *     summary: Generuj raport faktograficzny
 *     description: Generuje wyciąg tekstowy z wybranych aktów prawnych w formacie plain text
 *     tags: [Export]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista ID dokumentów do eksportu
 *                 example: ["eli-sejm-du-2025-1", "eli-sejm-mp-2025-2"]
 *     responses:
 *       200:
 *         description: Raport tekstowy
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: |
 *                 === WYCIĄG FAKTOGRAFICZNY ===
 *                 
 *                 [1] Rozporządzenie Ministra Zdrowia z dnia 19 grudnia 2024 r.
 *                 Data publikacji: 2025-01-02
 *                 Status: published
 *                 ...
 *       400:
 *         description: Błędne żądanie (brak tablicy ids)
 *       500:
 *         description: Błąd serwera
 */
router.post('/export/extract', async (req, res) => {
  const timestamp = new Date().toISOString();
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      console.error(`❌ [${timestamp}] Błąd /export: ids nie jest tablicą`);
      return res.status(400).json({ error: 'ids must be an array' });
    }
    
    console.log(`📝 [${timestamp}] Eksport ${ids.length} dokumentów`);
    const textExport = await getExport(ids);
    console.log(`✅ [${timestamp}] Wygenerowano raport (${textExport.length} znaków)`);
    
    res.type('text/plain').send(textExport);
  } catch (error: any) {
    console.error(`❌ [${timestamp}] Błąd /export:`, error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp 
    });
  }
});

/**
 * @swagger
 * /api/v1/updates/eli:
 *   get:
 *     summary: Pobierz akty prawne tylko z źródeł ELI
 *     description: Zwraca dokumenty z Sejmu (DU+MP), ministerstw i NBP
 *     tags: [Updates]
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 120d]
 *         description: Zakres czasowy
 *         example: 90d
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *         description: Konkretne źródło (np. 'eli-sejm-du', 'eli-mz')
 *     responses:
 *       200:
 *         description: Lista dokumentów ELI
 */
router.get('/updates/eli', async (req, res) => {
  const timestamp = new Date().toISOString();
  try {
    const rangeParam = req.query.range as string;
    const sourceParam = req.query.source as string;
    console.log(`📊 [${timestamp}] Pobieranie ELI updates: range=${rangeParam}, source=${sourceParam}`);
    
    const data = await getData(rangeParam, 'eli', sourceParam);
    
    console.log(`✅ [${timestamp}] Zwracam ${data.length} dokumentów ELI`);
    res.json(data);
  } catch (error: any) {
    console.error(`❌ [${timestamp}] Błąd /updates/eli:`, error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp 
    });
  }
});

/**
 * @swagger
 * /api/v1/updates/rss:
 *   get:
 *     summary: Pobierz akty prawne tylko z feedów RSS
 *     description: Zwraca dokumenty z ZUS i CEZ e-Zdrowie
 *     tags: [Updates]
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 120d]
 *         description: Zakres czasowy
 *     responses:
 *       200:
 *         description: Lista dokumentów RSS
 */
router.get('/updates/rss', async (req, res) => {
  const timestamp = new Date().toISOString();
  try {
    const rangeParam = req.query.range as string;
    const sourceParam = req.query.source as string;
    console.log(`📊 [${timestamp}] Pobieranie RSS updates: range=${rangeParam}, source=${sourceParam}`);
    
    const data = await getData(rangeParam, 'rss', sourceParam);
    
    console.log(`✅ [${timestamp}] Zwracam ${data.length} dokumentów RSS`);
    res.json(data);
  } catch (error: any) {
    console.error(`❌ [${timestamp}] Błąd /updates/rss:`, error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp 
    });
  }
});

/**
 * @swagger
 * /api/v1/updates/nfz:
 *   get:
 *     summary: Pobierz zarządzenia NFZ (scraper)
 *     description: Zwraca dokumenty ze scrapera NFZ
 *     tags: [Updates]
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 120d]
 *         description: Zakres czasowy
 *     responses:
 *       200:
 *         description: Lista zarządzeń NFZ
 */
router.get('/updates/nfz', async (req, res) => {
  const timestamp = new Date().toISOString();
  try {
    const rangeParam = req.query.range as string;
    console.log(`📊 [${timestamp}] Pobieranie NFZ updates: range=${rangeParam}`);
    
    const data = await getData(rangeParam, 'scraper');
    
    console.log(`✅ [${timestamp}] Zwracam ${data.length} dokumentów NFZ`);
    res.json(data);
  } catch (error: any) {
    console.error(`❌ [${timestamp}] Błąd /updates/nfz:`, error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp 
    });
  }
});

export default router;
