
export type UserProfileType = 'director' | 'legal' | 'staff' | 'dev';
export type IngestMethod = 'eli' | 'rss' | 'scraper';

export interface LegalUpdate {
  id: string;
  eliUri?: string;
  ingestMethod: IngestMethod;
  title: string;
  summary: string; // Krótkie streszczenie techniczne
  date: string;
  impact: 'low' | 'medium' | 'high'; // Ranga techniczna aktu
  category: string;
  legalStatus: string;
  officialRationale: string; // Oficjalne uzasadnienie z dokumentu
  sourceUrl?: string;
}

export interface MonitoredSite {
  id: string;
  url: string;
  name: string;
  isActive: boolean;
  type: IngestMethod;
}

export interface SystemConfig {
  masterSites: MonitoredSite[];
  strategicTopics: string[];
}

export interface GroundingLink {
  uri: string;
  title: string;
}

export interface DashboardStats {
  total: number;
  highImpact: number;
  mediumImpact: number;
  lowImpact: number;
}
