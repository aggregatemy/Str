export type IngestMethod = 'eli' | 'rss' | 'scraper';
export type LegalStatus = 'published' | 'draft' | 'informational';
export type Impact = 'low' | 'medium' | 'high';

export interface LegalFact {
  id: string;
  ingestMethod: IngestMethod;
  eliUri: string | null;
  title: string;
  summary: string;
  date: string;
  impact: Impact;
  category: string;
  legalStatus: LegalStatus;
  officialRationale: string;
  sourceUrl: string;
}
