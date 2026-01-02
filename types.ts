/**
 * Typ profilu użytkownika w systemie.
 * 
 * @description Określa rolę użytkownika, która może wpływać na sposób prezentacji danych.
 * W obecnej wersji profil 'legal' jest używany jako domyślny dla wszystkich użytkowników.
 * 
 * Możliwe wartości:
 * - 'director' - Dyrektor instytucji medycznej
 * - 'legal' - Radca prawny / prawnik (profil domyślny)
 * - 'staff' - Pracownik merytoryczny
 * - 'dev' - Deweloper systemu
 */
export type UserProfileType = 'director' | 'legal' | 'staff' | 'dev';

/**
 * Metoda pozyskiwania danych z oficjalnych źródeł.
 * 
 * @description Określa sposób ingestii danych prawnych z instytucji państwowych.
 * Każda metoda ma inne charakterystyki techniczne i wymaga dedykowanego parsera.
 * 
 * Możliwe wartości:
 * - 'eli' - Protokół ELI API (European Legislation Identifier) - ISAP
 * - 'rss' - Strumień RSS/XML (ZUS, CEZ, e-Zdrowie)
 * - 'scraper' - Backendowy scraper HTML (NFZ)
 */
export type IngestMethod = 'eli' | 'rss' | 'scraper';

/**
 * Interface reprezentujący pojedynczą aktualizację prawną.
 * 
 * @description Główny model danych reprezentujący akt prawny lub komunikat urzędowy
 * pobrany z oficjalnych źródeł administracji publicznej. Zawiera pełne metadane
 * dokumentu w znormalizowanej formie.
 * 
 * @interface LegalUpdate
 * @property {string} id - Unikalny identyfikator systemowy dokumentu
 * @property {string} [eliUri] - Opcjonalny identyfikator ELI URI (dla aktów z ISAP)
 * @property {IngestMethod} ingestMethod - Metoda pozyskania danych (eli/rss/scraper)
 * @property {string} title - Tytuł aktu prawnego lub komunikatu
 * @property {string} summary - Krótkie streszczenie techniczne dokumentu
 * @property {string} date - Data publikacji w formacie ISO lub czytelnym
 * @property {'low' | 'medium' | 'high'} impact - Ranga techniczna aktu (wpływ na system)
 * @property {string} category - Kategoria dokumentu (np. "Ustawa", "Zarządzenie")
 * @property {string} legalStatus - Status prawny dokumentu z metadanych źródłowych
 * @property {string} officialRationale - Oficjalne uzasadnienie z dokumentu źródłowego
 * @property {string} [sourceUrl] - Opcjonalny URL do dokumentu źródłowego
 */
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
}

/**
 * Interface reprezentujący monitorowane źródło danych.
 * 
 * @description Definiuje konfigurację pojedynczego źródła ingestii danych prawnych.
 * Każde źródło może być aktywowane lub dezaktywowane przez użytkownika.
 * 
 * @interface MonitoredSite
 * @property {string} id - Unikalny identyfikator źródła w systemie
 * @property {string} url - URL endpointu API, RSS lub strony do scrapingu
 * @property {string} name - Czytelna nazwa źródła (np. "ISAP ELI (System API)")
 * @property {boolean} isActive - Czy źródło jest aktywne w systemie
 * @property {IngestMethod} type - Typ technologii ingestii (eli/rss/scraper)
 */
export interface MonitoredSite {
  id: string;
  url: string;
  name: string;
  isActive: boolean;
  type: IngestMethod;
}

/**
 * Interface konfiguracji systemu.
 * 
 * @description Przechowuje pełną konfigurację systemu monitorowania, w tym listę
 * źródeł danych oraz tematy strategiczne do monitorowania. Konfiguracja jest
 * zapisywana w localStorage przeglądarki.
 * 
 * @interface SystemConfig
 * @property {MonitoredSite[]} masterSites - Lista wszystkich źródeł danych w systemie
 * @property {string[]} strategicTopics - Tematy strategiczne do monitorowania
 * @example
 * {
 *   masterSites: [
 *     { id: '1', name: 'ISAP ELI', url: 'https://isap.sejm.gov.pl/api/eli', isActive: true, type: 'eli' }
 *   ],
 *   strategicTopics: ["Zarządzenia Prezesa NFZ", "Ustawy zdrowotne"]
 * }
 */
export interface SystemConfig {
  masterSites: MonitoredSite[];
  strategicTopics: string[];
}

/**
 * Interface linku weryfikacyjnego (grounding link).
 * 
 * @description Reprezentuje zweryfikowany punkt danych użyty przez Gemini AI
 * do wygenerowania odpowiedzi. Służy do weryfikacji źródeł informacji.
 * System akceptuje tylko linki z oficjalnych domen .gov.pl, .zus.pl, .nfz.gov.pl.
 * 
 * @interface GroundingLink
 * @property {string} uri - URL zweryfikowanego źródła danych
 * @property {string} title - Tytuł strony źródłowej
 */
export interface GroundingLink {
  uri: string;
  title: string;
}

/**
 * Interface statystyk dashboardu.
 * 
 * @description Przechowuje zagregowane statystyki aktualizacji prawnych
 * pogrupowane według rangi wpływu. Wykorzystywane do wyświetlania
 * podsumowań statystycznych w interfejsie użytkownika.
 * 
 * @interface DashboardStats
 * @property {number} total - Całkowita liczba aktualizacji
 * @property {number} highImpact - Liczba aktualizacji o wysokim wpływie
 * @property {number} mediumImpact - Liczba aktualizacji o średnim wpływie
 * @property {number} lowImpact - Liczba aktualizacji o niskim wpływie
 */
export interface DashboardStats {
  total: number;
  highImpact: number;
  mediumImpact: number;
  lowImpact: number;
}
