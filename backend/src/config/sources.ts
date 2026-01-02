export const SOURCES = {
  // === ELI API ===
  ELI: 'https://isap.sejm.gov.pl/api/eli/acts',
  
  // === RSS FEEDS ===
  RSS_SOURCES: [
    {
      name: 'ZUS - Akty prawne',
      url: 'https://www.zus.pl/rss/akty-prawne.xml',
      category: 'ZUS'
    },
    {
      name: 'ZUS - Komunikaty',
      url: 'https://www.zus.pl/rss/komunikaty.xml',
      category: 'ZUS'
    },
    {
      name: 'Monitor Polski',
      url: 'https://monitorpolski.gov.pl/rss',
      category: 'Monitor Polski'
    },
    {
      name: 'Dziennik Ustaw',
      url: 'https://dziennikustaw.gov.pl/rss',
      category: 'Dziennik Ustaw'
    },
    {
      name: 'Sejm RP - Projekty ustaw',
      url: 'https://www.sejm.gov.pl/Sejm10.nsf/rss/projekty.xml',
      category: 'Sejm RP'
    }
  ],
  
  // === WEB SCRAPING ===
  NFZ_ZARZADZENIA: 'https://www.nfz.gov.pl/zarzadzenia-prezesa/',
  GUS_KOMUNIKATY: 'https://stat.gov.pl/aktualnosci/',
  
  // === GOVERNMENT PORTALS ===
  RCL: 'https://www.gov.pl/web/rcl/akty-prawne', // Rządowe Centrum Legislacji
  BIP_SEJM: 'https://bip.sejm.gov.pl/'
};

export interface RSSSource {
  name: string;
  url: string;
  category: string;
}
