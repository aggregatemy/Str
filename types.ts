
export interface LegalUpdate {
  id: string;
  title: string;
  description: string;
  sourceUrl: string;
  date: string;
  impact: 'low' | 'medium' | 'high';
  category: string;
  summary: string;
  checklist?: string[];
}

export interface MonitoredSite {
  id: string;
  url: string;
  name: string;
  lastChecked?: string;
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
