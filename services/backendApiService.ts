import { LegalUpdate, IngestMethod } from "../types";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface FetchUpdatesParams {
  range?: '7d' | '30d' | '90d';
  method?: IngestMethod;
}

export const fetchUpdates = async (params: FetchUpdatesParams = {}): Promise<LegalUpdate[]> => {
  const queryParams = new URLSearchParams();
  
  if (params.range) {
    queryParams.append('range', params.range);
  }
  
  if (params.method) {
    queryParams.append('method', params.method);
  }

  const url = `${BACKEND_URL}/api/v1/updates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }

    const data: LegalUpdate[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching updates from backend:', error);
    throw new Error('Nie udało się pobrać danych z backendu. Sprawdź czy serwer backend działa.');
  }
};

export const generateExtract = async (ids: string[]): Promise<string> => {
  const url = `${BACKEND_URL}/api/v1/export/extract`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    return text;
  } catch (error) {
    console.error('Error generating extract from backend:', error);
    throw new Error('Nie udało się wygenerować wyciągu. Sprawdź czy serwer backend działa.');
  }
};
