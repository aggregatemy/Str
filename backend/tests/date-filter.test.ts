
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock workerManager
vi.mock('../src/services/workerManager.js', () => ({
  workerManager: {
    getDetailedStatus: vi.fn().mockReturnValue({}),
    startAll: vi.fn(),
    stopAll: vi.fn()
  }
}));

// Mock dataService INLINE
vi.mock('../src/services/dataService.js', () => ({
  getData: vi.fn().mockResolvedValue([]),
  getExport: vi.fn().mockResolvedValue('Export')
}));

// Mock rdflib
vi.mock('rdflib', () => ({}));

import { app } from '../src/app';
import { getData } from '../src/services/dataService.js';

const API_PREFIX = '/api/v1';

describe('Backend Date Filtering', () => {
    
  it('GET /updates passes date parameter to service', async () => {
    const testDate = '2025-01-01';
    
    await request(app).get(`${API_PREFIX}/updates?date=${testDate}`);
    
    // Expect 4th argument to be testDate
    expect(vi.mocked(getData)).toHaveBeenCalledWith(
        undefined, // range
        undefined, // method
        undefined, // source
        testDate   // date
    );
  });

  it('GET /updates accepts mixed parameters', async () => {
    const testDate = '2025-01-01';
    
    await request(app).get(`${API_PREFIX}/updates?range=30d&method=eli&date=${testDate}`);
    
    expect(vi.mocked(getData)).toHaveBeenCalledWith('30d', 'eli', undefined, testDate);
  });
});
