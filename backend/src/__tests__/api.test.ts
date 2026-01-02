import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import apiRoutes from '../routes/api.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/v1', apiRoutes);

describe('API Endpoints', () => {
  describe('GET /api/v1/health', () => {
    it('powinien zwrócić status OK', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String)
      });
    });
  });

  describe('GET /api/v1/updates', () => {
    it('powinien zwrócić tablicę', async () => {
      const response = await request(app)
        .get('/api/v1/updates')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('powinien filtrować po zakresie dat', async () => {
      const response = await request(app)
        .get('/api/v1/updates?range=7d')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('powinien filtrować po metodzie', async () => {
      const response = await request(app)
        .get('/api/v1/updates?method=eli')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/v1/export/extract', () => {
    it('powinien zwrócić tekst dla poprawnych ID', async () => {
      const response = await request(app)
        .post('/api/v1/export/extract')
        .send({ ids: ['test-1'] })
        .expect(200);

      expect(typeof response.text).toBe('string');
    });

    it('powinien zwrócić 400 dla niepoprawnych danych', async () => {
      await request(app)
        .post('/api/v1/export/extract')
        .send({ ids: 'not-an-array' })
        .expect(400);
    });

    it('powinien zwrócić 400 gdy brak ids', async () => {
      await request(app)
        .post('/api/v1/export/extract')
        .send({})
        .expect(400);
    });
  });
});
