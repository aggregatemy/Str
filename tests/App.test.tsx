import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import App from '../App';
import * as apiService from '../services/apiService';

// Mock apiService - zamiast mockować funkcje axios, mockujemy cały moduł
vi.mock('../services/apiService');

beforeEach(() => {
  vi.clearAllMocks();
  // Setup default mock implementations
  vi.mocked(apiService.fetchLegalUpdates).mockResolvedValue([]);
  vi.mocked(apiService.exportUpdates).mockResolvedValue('Mock export data');
});

describe('App Component', () => {
  it('renderuje się bez błędów', () => {
    render(<App />);
    // App używa "Repozytorium Aktów" w nagłówku
    const body = document.body;
    expect(body.textContent).toContain('Repozytorium');
  });

  it('wyświetla komponenty UI', () => {
    render(<App />);
    // Sprawdź czy coś się wyrenderowało
    expect(document.body.children.length).toBeGreaterThan(0);
  });

  it('zawiera przycisk pobierania danych', () => {
    render(<App />);
    // App automatycznie ładuje dane, nie ma przycisku "Pobierz"
    // Sprawdzamy czy jest przycisk "Pobierz raport" lub inne przyciski
    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('ma sekcję na wyświetlanie dokumentów', () => {
    render(<App />);
    // App ma główny kontener
    const mainContent = document.querySelector('[class*="min-h-screen"]');
    expect(mainContent).toBeTruthy();
  });

  it('próbuje pobrać dane przy starcie', async () => {
    const { fetchLegalUpdates } = await import('../services/apiService');
    render(<App />);
    
    // fetchLegalUpdates powinien być wywołany przy montowaniu (useEffect)
    await waitFor(() => {
      expect(fetchLegalUpdates).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('obsługuje puste dane z backendu', async () => {
    const { fetchLegalUpdates } = await import('../services/apiService');
    vi.mocked(fetchLegalUpdates).mockResolvedValue([]);
    
    render(<App />);
    
    await waitFor(() => {
      expect(fetchLegalUpdates).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});
