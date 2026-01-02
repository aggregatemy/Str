import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../App';
import * as apiService from '../../services/apiService';

vi.mock('../../services/apiService');

describe('Full Application Flow', () => {
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

  it('powinien wykonać pełny flow: pobierz -> wyświetl -> zaznacz -> eksportuj', async () => {
    const mockData = [
      {
        id: '1',
        title: 'Ustawa o zdrowiu',
        category: 'Zdrowie',
        date: '2024-01-01',
        impact: 'high' as const,
        summary: 'Ważna ustawa',
        ingestMethod: 'eli' as const,
        legalStatus: 'in_force',
        officialRationale: 'Uzasadnienie',
        sourceUrl: 'https://test.gov.pl',
        eliUri: '/eli/1'
      }
    ];

    vi.mocked(apiService.fetchLegalUpdates).mockResolvedValue(mockData);
    vi.mocked(apiService.exportUpdates).mockResolvedValue('Exported text');

    // 1. Renderuj aplikację
    render(<App />);

    // 2. Poczekaj na załadowanie danych
    await waitFor(() => {
      expect(screen.getByText('Ustawa o zdrowiu')).toBeInTheDocument();
    });

    // 3. Sprawdź czy dokument jest zaznaczony (domyślnie wszystkie są zaznaczone)
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    // 4. Kliknij przycisk eksportu
    const exportButton = screen.getByText(/wygeneruj wyciąg faktograficzny/i);
    fireEvent.click(exportButton);

    // 5. Sprawdź czy wywołano export
    await waitFor(() => {
      expect(apiService.exportUpdates).toHaveBeenCalledWith(['1']);
    });

    // 6. Sprawdź czy modal raportu jest otwarty
    expect(screen.getByText(/wyciąg z dokumentacji urzędowej/i)).toBeInTheDocument();
  });

  it('powinien obsłużyć pełny flow archiwizacji', async () => {
    const mockData = [
      {
        id: '1',
        title: 'Dokument do archiwizacji',
        category: 'Prawo',
        date: '2024-01-01',
        impact: 'medium' as const,
        summary: 'Test',
        ingestMethod: 'rss' as const,
        legalStatus: 'published',
        officialRationale: 'Test',
        sourceUrl: 'https://test.gov.pl',
        eliUri: null
      }
    ];

    vi.mocked(apiService.fetchLegalUpdates).mockResolvedValue(mockData);

    // 1. Renderuj aplikację
    render(<App />);

    // 2. Poczekaj na załadowanie
    await waitFor(() => {
      expect(screen.getByText('Dokument do archiwizacji')).toBeInTheDocument();
    });

    // 3. Kliknij archiwizuj
    const saveButton = screen.getByText(/archiwizuj dokument/i);
    fireEvent.click(saveButton);

    // 4. Sprawdź status zarchiwizowany
    expect(screen.getByText(/zarchiwizowano/i)).toBeInTheDocument();

    // 5. Przejdź do widoku archiwum
    const archiveTab = screen.getByText(/zarchiwizowane/i);
    fireEvent.click(archiveTab);

    // 6. Sprawdź czy dokument jest w archiwum
    expect(screen.getByText('Dokument do archiwizacji')).toBeInTheDocument();
  });

  it('powinien obsłużyć zmianę zakresu czasowego i odświeżenie danych', async () => {
    const mockData7d = [
      {
        id: '1',
        title: 'Dokument 7 dni',
        category: 'Prawo',
        date: '2024-01-01',
        impact: 'low' as const,
        summary: 'Test',
        ingestMethod: 'eli' as const,
        legalStatus: 'in_force',
        officialRationale: 'Test',
        sourceUrl: 'https://test.gov.pl',
        eliUri: '/eli/1'
      }
    ];

    const mockData30d = [
      {
        id: '2',
        title: 'Dokument 30 dni',
        category: 'Prawo',
        date: '2024-01-01',
        impact: 'high' as const,
        summary: 'Test',
        ingestMethod: 'rss' as const,
        legalStatus: 'published',
        officialRationale: 'Test',
        sourceUrl: 'https://test.gov.pl',
        eliUri: null
      }
    ];

    vi.mocked(apiService.fetchLegalUpdates)
      .mockResolvedValueOnce(mockData7d)
      .mockResolvedValueOnce(mockData30d);

    // 1. Renderuj aplikację
    render(<App />);

    // 2. Poczekaj na załadowanie danych 7d
    await waitFor(() => {
      expect(screen.getByText('Dokument 7 dni')).toBeInTheDocument();
    });

    // 3. Zmień zakres na 30d
    const button30d = screen.getByText('30 dni');
    fireEvent.click(button30d);

    // 4. Poczekaj na załadowanie nowych danych
    await waitFor(() => {
      expect(screen.getByText('Dokument 30 dni')).toBeInTheDocument();
    });

    // 5. Sprawdź czy wywołano API z nowym zakresem
    expect(apiService.fetchLegalUpdates).toHaveBeenCalledWith('30d');
  });

  it('powinien obsłużyć zaznaczanie i odznaczanie dokumentów', async () => {
    const mockData = [
      {
        id: '1',
        title: 'Dokument 1',
        category: 'Prawo',
        date: '2024-01-01',
        impact: 'medium' as const,
        summary: 'Test',
        ingestMethod: 'eli' as const,
        legalStatus: 'in_force',
        officialRationale: 'Test',
        sourceUrl: 'https://test.gov.pl',
        eliUri: '/eli/1'
      },
      {
        id: '2',
        title: 'Dokument 2',
        category: 'Prawo',
        date: '2024-01-02',
        impact: 'low' as const,
        summary: 'Test',
        ingestMethod: 'rss' as const,
        legalStatus: 'published',
        officialRationale: 'Test',
        sourceUrl: 'https://test.gov.pl',
        eliUri: null
      }
    ];

    vi.mocked(apiService.fetchLegalUpdates).mockResolvedValue(mockData);

    // 1. Renderuj aplikację
    render(<App />);

    // 2. Poczekaj na załadowanie
    await waitFor(() => {
      expect(screen.getByText('Dokument 1')).toBeInTheDocument();
    });

    // 3. Sprawdź czy wszystkie są zaznaczone domyślnie
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0].checked).toBe(true);
    expect(checkboxes[1].checked).toBe(true);

    // 4. Odznacz pierwszy dokument
    fireEvent.click(checkboxes[0]);

    // 5. Sprawdź stan
    expect(checkboxes[0].checked).toBe(false);
    expect(checkboxes[1].checked).toBe(true);

    // 6. Sprawdź licznik w przycisku eksportu
    const exportButton = screen.getByText(/wygeneruj wyciąg faktograficzny \(1\)/i);
    expect(exportButton).toBeInTheDocument();
  });

  it('powinien wyświetlić modal raportu z wygenerowaną treścią', async () => {
    const mockData = [
      {
        id: '1',
        title: 'Modal Test Document',
        category: 'Prawo',
        date: '2024-01-01',
        impact: 'high' as const,
        summary: 'Modal test summary',
        ingestMethod: 'eli' as const,
        legalStatus: 'in_force',
        officialRationale: 'Modal test rationale',
        sourceUrl: 'https://test.gov.pl',
        eliUri: '/eli/1'
      }
    ];

    const mockExportText = 'Wygenerowany raport z dokumentacji prawnej';

    vi.mocked(apiService.fetchLegalUpdates).mockResolvedValue(mockData);
    vi.mocked(apiService.exportUpdates).mockResolvedValue(mockExportText);

    // 1. Renderuj aplikację
    render(<App />);

    // 2. Poczekaj na załadowanie
    await waitFor(() => {
      expect(screen.getByText('Modal Test Document')).toBeInTheDocument();
    });

    // 3. Kliknij eksport
    const exportButton = screen.getByText(/wygeneruj wyciąg faktograficzny/i);
    fireEvent.click(exportButton);

    // 4. Poczekaj na wygenerowanie raportu
    await waitFor(() => {
      expect(screen.getByText(mockExportText)).toBeInTheDocument();
    });

    // 5. Zamknij modal
    const closeButton = screen.getByText(/zamknij/i);
    fireEvent.click(closeButton);

    // 6. Sprawdź czy modal jest zamknięty
    await waitFor(() => {
      expect(screen.queryByText(/wyciąg z dokumentacji urzędowej/i)).not.toBeInTheDocument();
    });
  });
});
