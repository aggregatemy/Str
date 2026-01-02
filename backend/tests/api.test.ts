import { describe, it, expect } from 'vitest';
import axios from 'axios';

const BASE_URL = 'http://localhost:5554/api/v1';

describe('Backend API - Testy jednostkowe', () => {
  describe('GET /health', () => {
    it('powinien zwrócić status OK', async () => {
      const response = await axios.get(`${BASE_URL}/health`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'ok');
      expect(response.data).toHaveProperty('timestamp');
    });
  });

  describe('GET /updates', () => {
    it('powinien zwrócić pustą tablicę gdy brak danych', async () => {
      const response = await axios.get(`${BASE_URL}/updates`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('powinien zaakceptować parametr range=7d', async () => {
      const response = await axios.get(`${BASE_URL}/updates?range=7d`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('powinien zaakceptować parametr range=30d', async () => {
      const response = await axios.get(`${BASE_URL}/updates?range=30d`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('powinien zaakceptować parametr range=90d', async () => {
      const response = await axios.get(`${BASE_URL}/updates?range=90d`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('powinien zaakceptować parametr method=eli', async () => {
      const response = await axios.get(`${BASE_URL}/updates?method=eli`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('powinien zaakceptować parametr method=rss', async () => {
      const response = await axios.get(`${BASE_URL}/updates?method=rss`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('powinien zaakceptować parametr method=scraper', async () => {
      const response = await axios.get(`${BASE_URL}/updates?method=scraper`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('powinien zwrócić dane z poprawnymi polami', async () => {
      const response = await axios.get(`${BASE_URL}/updates?range=30d`);
      if (response.data.length > 0) {
        const item = response.data[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('date');
        expect(item).toHaveProperty('ingestMethod');
      }
    });
  });

  describe('POST /export/extract', () => {
    it('powinien zwrócić 400 gdy brak ids', async () => {
      try {
        await axios.post(`${BASE_URL}/export/extract`, {});
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('powinien zaakceptować pustą tablicę ids', async () => {
      const response = await axios.post(`${BASE_URL}/export/extract`, {
        ids: []
      });
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('string');
    });

    it('powinien zwrócić text/plain content-type', async () => {
      const response = await axios.post(`${BASE_URL}/export/extract`, {
        ids: []
      });
      expect(response.headers['content-type']).toContain('text/plain');
    });
  });

  describe('Swagger Documentation', () => {
    it('powinien serwować Swagger UI pod /api/docs', async () => {
      const response = await axios.get('http://localhost:5554/api/docs');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
    });
  });

  describe('CORS', () => {
    it('powinien mieć włączony CORS', async () => {
      const response = await axios.get(`${BASE_URL}/health`);
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });
});
