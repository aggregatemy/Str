export interface ELISource {
  id: string;
  name: string;
  institution: string;
  baseUrl: string;
  apiEndpoint: string;
  format: 'json-ld' | 'rdf-xml' | 'turtle' | 'auto';
  active: boolean;
  priority: number; // 1 = highest (Sejm), 5 = lowest
  category: string;
  description: string;
}

export const ELI_SOURCES: ELISource[] = [
  // === PRIORITY 1: GŁÓWNE ŹRÓDŁA ===
  {
    id: 'sejm',
    name: 'Sejm RP - Internetowy System Aktów Prawnych',
    institution: 'Sejm Rzeczypospolitej Polskiej',
    baseUrl: 'https://isap.sejm.gov.pl',
    apiEndpoint: 'https://isap.sejm.gov.pl/api/eli/acts',
    format: 'json-ld',
    active: true,
    priority: 1,
    category: 'Prawo krajowe',
    description: 'Główne repozytorium aktów prawnych RP (ustawy, rozporządzenia)'
  },
  {
    id: 'rcl',
    name: 'Rządowe Centrum Legislacji',
    institution: 'Rządowe Centrum Legislacji',
    baseUrl: 'https://legislacja.rcl.gov.pl',
    apiEndpoint: 'https://legislacja.rcl.gov.pl/api/eli',
    format: 'json-ld',
    active: true,
    priority: 1,
    category: 'Prawo krajowe',
    description: 'Projekty aktów prawnych w toku legislacji'
  },
  
  // === PRIORITY 2: MINISTERSTWA ===
  {
    id: 'mz',
    name: 'Ministerstwo Zdrowia',
    institution: 'Ministerstwo Zdrowia',
    baseUrl: 'https://www.gov.pl/web/zdrowie',
    apiEndpoint: 'https://www.gov.pl/api/eli/mz',
    format: 'json-ld',
    active: true,
    priority: 2,
    category: 'Zdrowie',
    description: 'Akty prawne z zakresu zdrowia publicznego'
  },
  {
    id: 'mf',
    name: 'Ministerstwo Finansów',
    institution: 'Ministerstwo Finansów',
    baseUrl: 'https://www.gov.pl/web/finanse',
    apiEndpoint: 'https://www.gov.pl/api/eli/mf',
    format: 'json-ld',
    active: true,
    priority: 2,
    category: 'Finanse publiczne',
    description: 'Przepisy podatkowe, budżetowe, celne'
  },
  {
    id: 'me',
    name: 'Ministerstwo Edukacji',
    institution: 'Ministerstwo Edukacji i Nauki',
    baseUrl: 'https://www.gov.pl/web/edukacja-i-nauka',
    apiEndpoint: 'https://www.gov.pl/api/eli/me',
    format: 'json-ld',
    active: true,
    priority: 2,
    category: 'Edukacja',
    description: 'Prawo oświatowe i szkolnictwo wyższe'
  },
  
  // === PRIORITY 3: AGENCJE I URZĘDY ===
  {
    id: 'urpl',
    name: 'Urząd Rejestracji Produktów Leczniczych',
    institution: 'URPL',
    baseUrl: 'https://urpl.gov.pl',
    apiEndpoint: 'https://urpl.gov.pl/api/eli',
    format: 'json-ld',
    active: true,
    priority: 3,
    category: 'Leki i wyroby medyczne',
    description: 'Rejestry leków, decyzje administracyjne URPL'
  },
  {
    id: 'gus',
    name: 'Główny Urząd Statystyczny',
    institution: 'GUS',
    baseUrl: 'https://stat.gov.pl',
    apiEndpoint: 'https://api.stat.gov.pl/eli',
    format: 'json-ld',
    active: true,
    priority: 3,
    category: 'Statystyka publiczna',
    description: 'Obwieszczenia i komunikaty GUS'
  },
  {
    id: 'uokik',
    name: 'Urząd Ochrony Konkurencji i Konsumentów',
    institution: 'UOKiK',
    baseUrl: 'https://www.uokik.gov.pl',
    apiEndpoint: 'https://www.uokik.gov.pl/api/eli',
    format: 'json-ld',
    active: false, // Do weryfikacji
    priority: 3,
    category: 'Konkurencja i konsumenci',
    description: 'Decyzje UOKiK, interpretacje'
  },
  
  // === PRIORITY 4: SAMORZĄDY (przykłady) ===
  {
    id: 'bip-warszawa',
    name: 'BIP m.st. Warszawy',
    institution: 'Urząd m.st. Warszawy',
    baseUrl: 'https://bip.warszawa.pl',
    apiEndpoint: 'https://bip.warszawa.pl/api/eli',
    format: 'json-ld',
    active: false, // Wymaga weryfikacji
    priority: 4,
    category: 'Prawo lokalne',
    description: 'Uchwały Rady m.st. Warszawy'
  },
  
  // === PRIORITY 5: INNE ŹRÓDŁA ===
  {
    id: 'monitor-polski',
    name: 'Monitor Polski',
    institution: 'Monitor Polski',
    baseUrl: 'https://monitorpolski.gov.pl',
    apiEndpoint: 'https://monitorpolski.gov.pl/api/eli',
    format: 'json-ld',
    active: true,
    priority: 2,
    category: 'Publikator prawny',
    description: 'Oficjalny dziennik promulgacyjny RP'
  },
  {
    id: 'dziennik-ustaw',
    name: 'Dziennik Ustaw RP',
    institution: 'Dziennik Ustaw',
    baseUrl: 'https://dziennikustaw.gov.pl',
    apiEndpoint: 'https://dziennikustaw.gov.pl/api/eli',
    format: 'json-ld',
    active: true,
    priority: 1,
    category: 'Publikator prawny',
    description: 'Główny publikator aktów normatywnych'
  }
];

// Filtruj tylko aktywne źródła
export const getActiveSources = () => ELI_SOURCES.filter(s => s.active);

// Sortuj po priorytecie
export const getSourcesByPriority = () => 
  getActiveSources().sort((a, b) => a.priority - b.priority);
