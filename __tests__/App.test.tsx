import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import * as apiService from '../services/apiService';

vi.mock('../services/apiService');

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
      removeItem: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    global.localStorage = localStorageMock as any;
  });

  it('powinien wyrenderować aplikację', () => {
    vi.mocked(apiService.fetchLegalUpdates).mockResolvedValue([]);
    
    render(<App />);
    
    expect(screen.getByText(/repozytorium aktów/i)).toBeInTheDocument();
  });

  it('powinien pobrać dane przy montowaniu', async () => {
    const mockData = [
      {
        id: '1',
        title: 'Test',
        date: '2024-01-01',
        summary: 'Test summary',
        impact: 'high' as const,
        category: 'Prawo',
        ingestMethod: 'eli' as const,
        legalStatus: 'in_force',
        officialRationale: 'Test',
        sourceUrl: 'https://test.gov.pl',
        eliUri: '/eli/test/1'
      }
    ];

    vi.mocked(apiService.fetchLegalUpdates).mockResolvedValue(mockData);
    
    render(<App />);

    await waitFor(() => {
      expect(apiService.fetchLegalUpdates).toHaveBeenCalled();
    });
  });

  it('powinien zmienić zakres czasowy', async () => {
    vi.mocked(apiService.fetchLegalUpdates).mockResolvedValue([]);
    
    render(<App />);

    await waitFor(() => {
      expect(apiService.fetchLegalUpdates).toHaveBeenCalled();
    });

    const button30d = screen.getByText('30 dni');
    fireEvent.click(button30d);

    await waitFor(() => {
      expect(apiService.fetchLegalUpdates).toHaveBeenCalledWith('30d');
    });
  });

  it('powinien wyświetlić błąd przy nieudanym pobieraniu', async () => {
    vi.mocked(apiService.fetchLegalUpdates).mockRejectedValue(
      new Error('Network error')
    );
    
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/błąd systemu ingestii/i)).toBeInTheDocument();
    });
  });

  it('powinien przełączać widoki', async () => {
    vi.mocked(apiService.fetchLegalUpdates).mockResolvedValue([]);
    
    render(<App />);

    await waitFor(() => {
      expect(apiService.fetchLegalUpdates).toHaveBeenCalled();
    });

    const archiveButton = screen.getByText(/zarchiwizowane/i);
    fireEvent.click(archiveButton);

    expect(archiveButton.className).toContain('border-slate-900');
  });

  it('powinien wyświetlić konfigurację źródeł', async () => {
    vi.mocked(apiService.fetchLegalUpdates).mockResolvedValue([]);
    
    render(<App />);

    await waitFor(() => {
      expect(apiService.fetchLegalUpdates).toHaveBeenCalled();
    });

    const paramsButton = screen.getByText(/parametry api/i);
    fireEvent.click(paramsButton);

    expect(screen.getByText(/architektura ingestii backendu/i)).toBeInTheDocument();
  });

  it('powinien zaznaczać dokumenty do eksportu', async () => {
    const mockData = [
      {
        id: '1',
        title: 'Test Document',
        category: 'Prawo',
        date: '2024-01-01',
        impact: 'high' as const,
        summary: 'Test',
        ingestMethod: 'eli' as const,
        legalStatus: 'in_force',
        officialRationale: 'Test',
        sourceUrl: 'https://test.gov.pl',
        eliUri: '/eli/1'
      }
    ];

    vi.mocked(apiService.fetchLegalUpdates).mockResolvedValue(mockData);
    
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked(); // Should be checked by default
  });

  it('powinien wyświetlić przycisk eksportu gdy są zaznaczone dokumenty', async () => {
    const mockData = [
      {
        id: '1',
        title: 'Test',
        category: 'Prawo',
        date: '2024-01-01',
        impact: 'high' as const,
        summary: 'Test',
        ingestMethod: 'eli' as const,
        legalStatus: 'in_force',
        officialRationale: 'Test',
        sourceUrl: 'https://test.gov.pl',
        eliUri: '/eli/1'
      }
    ];

    vi.mocked(apiService.fetchLegalUpdates).mockResolvedValue(mockData);
    
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/wygeneruj wyciąg faktograficzny/i)).toBeInTheDocument();
    });
  });

  it('powinien wywołać exportUpdates przy kliknięciu przycisku eksportu', async () => {
    const mockData = [
      {
        id: '1',
        title: 'Test Export Document',
        category: 'Prawo',
        date: '2024-01-01',
        impact: 'high' as const,
        summary: 'Test export summary',
        ingestMethod: 'eli' as const,
        legalStatus: 'in_force',
        officialRationale: 'Test export rationale',
        sourceUrl: 'https://test.gov.pl',
        eliUri: '/eli/1'
      }
    ];

    vi.mocked(apiService.fetchLegalUpdates).mockResolvedValue(mockData);
    vi.mocked(apiService.exportUpdates).mockResolvedValue('Exported text');
    
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Export Document')).toBeInTheDocument();
    });

    const exportButton = screen.getByText(/wygeneruj wyciąg faktograficzny/i);
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(apiService.exportUpdates).toHaveBeenCalledWith(['1']);
    });
  });

  it('powinien zapisywać dokumenty do archiwum', async () => {
    const mockData = [
      {
        id: '1',
        title: 'Test Document',
        category: 'Prawo',
        date: '2024-01-01',
        impact: 'high' as const,
        summary: 'Test',
        ingestMethod: 'eli' as const,
        legalStatus: 'in_force',
        officialRationale: 'Test',
        sourceUrl: 'https://test.gov.pl',
        eliUri: '/eli/1'
      }
    ];

    vi.mocked(apiService.fetchLegalUpdates).mockResolvedValue(mockData);
    
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });

    const saveButton = screen.getByText(/archiwizuj dokument/i);
    fireEvent.click(saveButton);

    expect(screen.getByText(/zarchiwizowano/i)).toBeInTheDocument();
  });
});
