import { LegalUpdate } from '../types';

const API_BASE = '/api/v1';

export async function fetchLegalUpdates(range?: string): Promise<LegalUpdate[]> {
  try {
    const params = new URLSearchParams();
    if (range) params.set('range', range);

    const response = await fetch(`${API_BASE}/updates?${params}`);
    if (!response.ok) throw new Error('Błąd pobierania danych');

    const data = await response.json();
    
    return data.map((item: any) => ({
      id: item.id,
      eliUri: item.eliUri,
      ingestMethod: item.ingestMethod,
      title: item.title,
      summary: item.summary,
      date: item.date,
      impact: item.impact,
      category: item.category,
      legalStatus: item.legalStatus,
      officialRationale: item.officialRationale,
      sourceUrl: item.sourceUrl
    }));
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export async function exportUpdates(ids: string[]): Promise<string> {
  const response = await fetch(`${API_BASE}/export/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  });

  if (!response.ok) throw new Error('Błąd eksportu');
  return response.text();
}
