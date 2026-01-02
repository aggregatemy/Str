import request from 'supertest';
import { app } from '../../src/app';
import { StorageService } from '../../src/services/storage';

describe('API Integration Tests', () => {
  beforeAll(() => {
    // Use in-memory database for tests
    process.env.DATABASE_PATH = ':memory:';
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api/v1/updates', () => {
    it('should return empty array when no data', async () => {
      const response = await request(app).get('/api/v1/updates');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should return array of updates', async () => {
      const storage = new StorageService();
      
      await storage.saveLegalUpdate({
        id: 'test-id-1',
        ingestMethod: 'scraper',
        title: 'Test Document',
        summary: 'Test summary',
        date: '2024-01-15',
        impact: 'medium',
        category: 'Zarządzenie',
        legalStatus: 'obowiązujący',
        officialRationale: 'Test rationale'
      });

      const response = await request(app).get('/api/v1/updates');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('title');
    });

    it('should filter by range parameter', async () => {
      const response = await request(app).get('/api/v1/updates?range=7d');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter by method parameter', async () => {
      const response = await request(app).get('/api/v1/updates?method=scraper');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return error for invalid range', async () => {
      const response = await request(app).get('/api/v1/updates?range=invalid');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return error for invalid method', async () => {
      const response = await request(app).get('/api/v1/updates?method=invalid');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/export/extract', () => {
    it('should return error for missing ids', async () => {
      const response = await request(app)
        .post('/api/v1/export/extract')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return error for empty ids array', async () => {
      const response = await request(app)
        .post('/api/v1/export/extract')
        .send({ ids: [] });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return text extract for valid ids', async () => {
      const storage = new StorageService();
      
      await storage.saveLegalUpdate({
        id: 'extract-test-1',
        ingestMethod: 'scraper',
        title: 'Document for Extract',
        summary: 'Summary for extract',
        date: '2024-01-15',
        impact: 'medium',
        category: 'Zarządzenie',
        legalStatus: 'obowiązujący',
        officialRationale: 'Rationale for extract'
      });

      const response = await request(app)
        .post('/api/v1/export/extract')
        .send({ ids: ['extract-test-1'] });
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('DOKUMENT:');
      expect(response.text).toContain('Document for Extract');
    });

    it('should return 404 for non-existent ids', async () => {
      const response = await request(app)
        .post('/api/v1/export/extract')
        .send({ ids: ['non-existent-id'] });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/v1/unknown');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });
});
