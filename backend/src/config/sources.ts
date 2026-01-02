export const SOURCES = {
  // Nowe API Sejmu (JSON, ELI Standard)
  ELI_API_SEJM: 'https://api.sejm.gov.pl/eli/',
  ELI_SEARCH: 'https://api.sejm.gov.pl/eli/search',
  
  // Kanały RSS (Aktywne)
  RSS_ZUS: 'https://www.zus.pl/o-zus/aktualnosci/-/asset_publisher/aktualnosci/rss', // Aktualności ZUS
  RSS_ZUS_WYJASNIENIA: 'https://www.zus.pl/baza-wiedzy/biezace-wyjasnienia-komorek-merytorycznych/-/asset_publisher/biezace-wyjasnienia-komorek-merytorycznych/rss', // Wyjaśnienia
  RSS_CEZ: 'https://www.ezdrowie.gov.pl/portal/home/rss', // e-Zdrowie
  
  // Scraper HTML - Baza Aktów Własnych (DevExpress, wymaga Playwright dla pełnej obsługi)
  NFZ_BAW: 'https://baw.nfz.gov.pl/NFZ/tabBrowser/mainPage'
};
