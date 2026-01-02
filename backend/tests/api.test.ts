
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock workerManager BEFORE importing app
vi.mock('../src/services/workerManager.js', () => ({
  workerManager: {
    getDetailedStatus: vi.fn().mockReturnValue({ 
      overall: 'healthy', 
      timestamp: new Date().toISOString(),
      workers: { eli: {}, rss: {}, nfz: {} }
    }),
    startAll: vi.fn(),
    stopAll: vi.fn()
  }
}));

// Mock dataService to avoid loading scrapers and rdflib
vi.mock('../src/services/dataService.js', () => ({
  getData: vi.fn().mockResolvedValue([]),
  getExport: vi.fn().mockResolvedValue('Mock Export')
}));

import { app } from '../src/app';

const API_PREFIX = '/api/v1';

describe('Backend API - Testy jednostkowe', () => {
  describe('GET /health', () => {
    it('powinien zwrócić status OK', async () => {
      const response = await request(app).get(`${API_PREFIX}/health`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /updates', () => {
    it('powinien zwrócić pustą tablicę gdy brak danych (lub tablicę)', async () => {
      const response = await request(app).get(`${API_PREFIX}/updates`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('powinien zaakceptować parametr range=7d', async () => {
      const response = await request(app).get(`${API_PREFIX}/updates?range=7d`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('powinien zaakceptować parametr range=30d', async () => {
      const response = await request(app).get(`${API_PREFIX}/updates?range=30d`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('powinien zaakceptować parametr range=90d', async () => {
      const response = await request(app).get(`${API_PREFIX}/updates?range=90d`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('powinien zaakceptować parametr method=eli', async () => {
      const response = await request(app).get(`${API_PREFIX}/updates?method=eli`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('powinien zaakceptować parametr method=rss', async () => {
      const response = await request(app).get(`${API_PREFIX}/updates?method=rss`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('powinien zaakceptować parametr method=scraper', async () => {
      const response = await request(app).get(`${API_PREFIX}/updates?method=scraper`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('powinien zwrócić dane z poprawnymi polami', async () => {
      const response = await request(app).get(`${API_PREFIX}/updates?range=30d`);
      if (response.body.length > 0) {
        const item = response.body[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('date');
        expect(item).toHaveProperty('ingestMethod');
      }
    });
  });

  describe('POST /export/extract', () => {
    it('powinien zwrócić 400 gdy brak ids', async () => {
        const response = await request(app).post(`${API_PREFIX}/export/extract`).send({});
        expect(response.status).toBe(400);
    });

    it('powinien zaakceptować pustą tablicę ids', async () => {
      const response = await request(app).post(`${API_PREFIX}/export/extract`).send({
        ids: []
      });
      expect(response.status).toBe(200);
      expect(typeof response.text).toBe('string');
    });

    it('powinien zwrócić text/plain content-type', async () => {
      const response = await request(app).post(`${API_PREFIX}/export/extract`).send({
        ids: []
      });
      expect(response.headers['content-type']).toContain('text/plain');
    });
  });

  describe('Swagger Documentation', () => {
    it('powinien serwować Swagger UI pod /api/docs/', async () => {
      const response = await request(app).get('/api/docs/');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
    });
  });

  describe('CORS', () => {
    it('powinien mieć włączony CORS', async () => {
      const response = await request(app).get(`${API_PREFIX}/health`);
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });
});
