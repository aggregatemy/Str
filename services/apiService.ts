import { LegalUpdate } from '../types';

// Backend działa na porcie 5554 (izolacja środowiska)
const API_BASE = '/api/v1';
const TIMEOUT_MS = 15000; // 15 sekund

// Type guard to validate LegalUpdate structure
function isValidLegalUpdate(item: unknown): item is LegalUpdate {
  if (typeof item !== 'object' || item === null) return false;
  
  const obj = item as Record<string, unknown>;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.summary === 'string' &&
    typeof obj.date === 'string' &&
    typeof obj.ingestMethod === 'string' &&
    typeof obj.category === 'string' &&
    typeof obj.legalStatus === 'string'
  );
}

function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = TIMEOUT_MS): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: Serwer nie odpowiedział w określonym czasie')), timeout)
    )
  ]);
}

function mapToLegalUpdate(item: unknown): LegalUpdate | null {
  if (!isValidLegalUpdate(item)) {
    console.warn('Invalid LegalUpdate structure:', item);
    return null;
  }
  return item;
}

export async function fetchLegalUpdates(range?: string, date?: string): Promise<LegalUpdate[]> {
  try {
    const params = new URLSearchParams();
    if (range) params.set('range', range);
    if (date) params.set('date', date);

    const response = await fetchWithTimeout(`${API_BASE}/updates?${params}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Endpoint API nie istnieje. Sprawdź konfigurację backendu.');
      }
      if (response.status === 500) {
        throw new Error('Błąd serwera. Sprawdź logi backendu.');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: unknown = await response.json();
    
    if (!Array.isArray(data)) {
      console.warn('API zwróciło nieprawidłowy format danych:', data);
      return [];
    }
    
    return data
      .map(mapToLegalUpdate)
      .filter((item): item is LegalUpdate => item !== null);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('API Error:', errorMessage);
    if (errorMessage.includes('Failed to fetch')) {
      throw new Error('Błąd połączenia. Backend nie działa lub jest niedostępny na porcie 5554.');
    }
    throw error;
  }
}

export async function fetchELIUpdates(range?: string, source?: string): Promise<LegalUpdate[]> {
  try {
    const params = new URLSearchParams();
    if (range) params.set('range', range);
    if (source) params.set('source', source);

    const response = await fetchWithTimeout(`${API_BASE}/updates/eli?${params}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Endpoint ELI nie istnieje. Sprawdź konfigurację backendu.');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: unknown = await response.json();
    
    if (!Array.isArray(data)) {
      console.warn('API zwróciło nieprawidłowy format danych:', data);
      return [];
    }
    
    return data
      .map(mapToLegalUpdate)
      .filter((item): item is LegalUpdate => item !== null);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('ELI API Error:', errorMessage);
    throw error;
  }
}

export async function fetchRSSUpdates(range?: string): Promise<LegalUpdate[]> {
  try {
    const params = new URLSearchParams();
    if (range) params.set('range', range);

    const response = await fetchWithTimeout(`${API_BASE}/updates/rss?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: unknown = await response.json();
    
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data
      .map(mapToLegalUpdate)
      .filter((item): item is LegalUpdate => item !== null);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('RSS API Error:', errorMessage);
    throw error;
  }
}

export async function fetchNFZUpdates(range?: string): Promise<LegalUpdate[]> {
  try {
    const params = new URLSearchParams();
    if (range) params.set('range', range);

    const response = await fetchWithTimeout(`${API_BASE}/updates/nfz?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: unknown = await response.json();
    
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data
      .map(mapToLegalUpdate)
      .filter((item): item is LegalUpdate => item !== null);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('NFZ API Error:', errorMessage);
    throw error;
  }
}

export async function exportUpdates(ids: string[]): Promise<string> {
  try {
    if (!ids || ids.length === 0) {
      throw new Error('Brak wybranych dokumentów do eksportu.');
    }

    const response = await fetchWithTimeout(`${API_BASE}/export/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('Nieprawidłowe żądanie. Sprawdź wybrane dokumenty.');
      }
      throw new Error(`HTTP ${response.status}: Nie udało się wygenerować raportu`);
    }
    
    const text = await response.text();
    
    if (!text || text.trim().length === 0) {
      throw new Error('Backend zwrócił pusty raport.');
    }
    
    return text;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Export Error:', errorMessage);
    if (errorMessage.includes('Failed to fetch')) {
      throw new Error('Błąd połączenia z backendem podczas eksportu.');
    }
    throw error;
  }
}
