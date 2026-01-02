export type UserProfileType = 'director' | 'legal' | 'staff' | 'dev';
export type IngestMethod = 'eli' | 'rss' | 'scraper';

export interface LegalUpdate {
  id: string;
  eliUri?: string;
  ingestMethod: IngestMethod;
  title: string;
  summary: string;
  date: string;
  impact: 'low' | 'medium' | 'high';
  category: string;
  legalStatus: string;
  officialRationale: string;
  sourceUrl?: string;
  rawData?: string;
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

// NFZ Scraper Types
export interface NFZDocument {
  Id: number;
  InstitutionId: number;
  Title: string;
  Subject: string;
  Date: string;
  Type: string;
}

export interface NFZDocumentDetails {
  Name: string;
  InstitutionId: number;
  Files: Array<{ Id: number; Name: string; IsZipxAttachment: boolean }>;
  AmendmentEntries: any[];
}

// ELI Types
export interface ELIDocument {
  id: string;
  title: string;
  date: string;
  status: string;
  type: string;
  uri: string;
}

// RSS Types
export interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  guid: string;
}
