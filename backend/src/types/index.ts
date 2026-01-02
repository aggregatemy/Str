export interface LegalFact {
  id: string;
  ingestMethod: 'eli' | 'rss' | 'scraper';
  eliUri: string | null;
  title: string;
  summary: string;
  date: string;
  impact: 'low' | 'medium' | 'high';
  category: string;
  legalStatus: string;
  officialRationale: string;
  sourceUrl: string;
}
