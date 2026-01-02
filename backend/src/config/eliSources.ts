export interface ELISource {
  id: string;
  name: string;
  institution: string;
  baseUrl: string;
  apiEndpoint: string;
  format: 'json-ld' | 'rdf-xml' | 'turtle' | 'auto' | 'json' | 'xml';
  clientType: 'A' | 'B'; // A = Sejm (JSON), B = Resortowe (XML)
  dziennikId?: string; // ID dziennika dla API resortowego (np. DUM_MZ)
  active: boolean;
  priority: number; // 1 = highest (Sejm), 5 = lowest
  category: string;
  description: string;
}

export const ELI_SOURCES: ELISource[] = [
  // === KLIENT A: PARLAMENT (Serwer Centralny - JSON) ===
  {
    id: 'sejm-du',
    name: 'Sejm RP - Dziennik Ustaw (DU)',
    institution: 'Sejm Rzeczypospolitej Polskiej',
    baseUrl: 'https://api.sejm.gov.pl',
    apiEndpoint: 'https://api.sejm.gov.pl/eli/acts/DU',
    format: 'json',
    clientType: 'A',
    dziennikId: 'DU',
    active: true,
    priority: 1,
    category: 'Ustawy i Rozporządzenia',
    description: 'Dziennik Ustaw - ustawy, rozporządzenia Rady Ministrów i ministrów'
  },
  {
    id: 'sejm-mp',
    name: 'Sejm RP - Monitor Polski (MP)',
    institution: 'Sejm Rzeczypospolitej Polskiej',
    baseUrl: 'https://api.sejm.gov.pl',
    apiEndpoint: 'https://api.sejm.gov.pl/eli/acts/MP',
    format: 'json',
    clientType: 'A',
    dziennikId: 'MP',
    active: true,
    priority: 1,
    category: 'Monitor Polski',
    description: 'Monitor Polski - uchwały Sejmu/Senatu, obwieszczenia'
  },
  
  // === KLIENT B: MINISTERSTWA (Serwery Resortowe - XML) ===
  {
    id: 'mz',
    name: 'Ministerstwo Zdrowia',
    institution: 'Ministerstwo Zdrowia',
    baseUrl: 'https://dziennikmz.mz.gov.pl',
    apiEndpoint: 'https://dziennikmz.mz.gov.pl/api/eli/acts',
    format: 'xml',
    clientType: 'B',
    dziennikId: 'DUM_MZ',
    active: true,
    priority: 1,
    category: 'Zdrowie',
    description: 'Dziennik Urzędowy MZ - zarządzenia Ministra Zdrowia'
  },
  {
    id: 'mswia',
    name: 'MSWiA - Ministerstwo Spraw Wewnętrznych',
    institution: 'MSWiA',
    baseUrl: 'https://edziennik.mswia.gov.pl',
    apiEndpoint: 'https://edziennik.mswia.gov.pl/api/eli/acts',
    format: 'xml',
    clientType: 'B',
    dziennikId: 'DUM_MSW',
    active: true,
    priority: 2,
    category: 'Służby mundurowe',
    description: 'Dziennik Urzędowy MSWiA - zarządzenia służb mundurowych'
  },
  {
    id: 'men',
    name: 'Ministerstwo Edukacji',
    institution: 'Ministerstwo Edukacji Narodowej',
    baseUrl: 'https://dziennik.men.gov.pl',
    apiEndpoint: 'https://dziennik.men.gov.pl/api/eli/acts',
    format: 'xml',
    clientType: 'B',
    dziennikId: 'DUM_MEN',
    active: true,
    priority: 2,
    category: 'Edukacja',
    description: 'Dziennik Urzędowy MEN - zarządzenia oświatowe'
  },
  {
    id: 'mon',
    name: 'Ministerstwo Obrony Narodowej',
    institution: 'MON',
    baseUrl: 'https://dziennik.mon.gov.pl',
    apiEndpoint: 'https://dziennik.mon.gov.pl/api/eli/acts',
    format: 'xml',
    clientType: 'B',
    dziennikId: 'DUM_MON',
    active: true,
    priority: 2,
    category: 'Wojsko',
    description: 'Dziennik Urzędowy MON - zarządzenia wojskowe'
  },
  {
    id: 'mkidn',
    name: 'Ministerstwo Kultury',
    institution: 'Ministerstwo Kultury i Dziedzictwa Narodowego',
    baseUrl: 'https://dziennik.kultura.gov.pl',
    apiEndpoint: 'https://dziennik.kultura.gov.pl/api/eli/acts',
    format: 'xml',
    clientType: 'B',
    dziennikId: 'DUM_MKIDN',
    active: true,
    priority: 3,
    category: 'Kultura',
    description: 'Dziennik Urzędowy MKiDN'
  },
  {
    id: 'klimat',
    name: 'Ministerstwo Klimatu',
    institution: 'Ministerstwo Klimatu i Środowiska',
    baseUrl: 'https://dziennik.klimat.gov.pl',
    apiEndpoint: 'https://dziennik.klimat.gov.pl/api/eli/acts',
    format: 'xml',
    clientType: 'B',
    dziennikId: 'DUM_MK',
    active: true,
    priority: 3,
    category: 'Środowisko',
    description: 'Dziennik Urzędowy MK - ochrona środowiska'
  },
  {
    id: 'uprp',
    name: 'Urząd Patentowy RP',
    institution: 'UPRP',
    baseUrl: 'https://edziennik.uprp.gov.pl',
    apiEndpoint: 'https://edziennik.uprp.gov.pl/api/eli/acts',
    format: 'xml',
    clientType: 'B',
    dziennikId: 'DUM_UPRP',
    active: true,
    priority: 3,
    category: 'Własność intelektualna',
    description: 'Dziennik Urzędowy UPRP'
  },
  {
    id: 'gus',
    name: 'Główny Urząd Statystyczny',
    institution: 'GUS',
    baseUrl: 'https://dziennikurzedowy.stat.gov.pl',
    apiEndpoint: 'https://dziennikurzedowy.stat.gov.pl/api/eli/acts',
    format: 'xml',
    clientType: 'B',
    dziennikId: 'DUM_GUS',
    active: true,
    priority: 3,
    category: 'Statystyka',
    description: 'Dziennik Urzędowy GUS'
  },
  {
    id: 'pgr',
    name: 'Prokuratoria Generalna RP',
    institution: 'Prokuratoria Generalna',
    baseUrl: 'https://edziennik.pgr.gov.pl',
    apiEndpoint: 'https://edziennik.pgr.gov.pl/api/eli/acts',
    format: 'xml',
    clientType: 'B',
    dziennikId: 'DUM_PGR',
    active: true,
    priority: 3,
    category: 'Prokuratoria',
    description: 'Dziennik Urzędowy PGR'
  },
  {
    id: 'nbp',
    name: 'Narodowy Bank Polski',
    institution: 'NBP',
    baseUrl: 'https://dzu.nbp.pl',
    apiEndpoint: 'https://dzu.nbp.pl/api/eli/acts',
    format: 'xml',
    clientType: 'B',
    dziennikId: 'DUM_NBP',
    active: true,
    priority: 2,
    category: 'Bank centralny',
    description: 'Dziennik Urzędowy NBP'
  },
  
  // === UWAGA: Systemy BEZ API ELI (wymagają scrapingu HTML) ===
  // - NFZ Centrala (baw.nfz.gov.pl) - już zaimplementowany jako nfzScraper
  // - Ministerstwo Finansów - dziennik wygaszony
  // - KPRM - publikuje głównie w M.P. (obsługiwane przez Sejm)
];

// Filtruj tylko aktywne źródła
export const getActiveSources = () => ELI_SOURCES.filter(s => s.active);

// Sortuj po priorytecie
export const getSourcesByPriority = () => 
  getActiveSources().sort((a, b) => a.priority - b.priority);
