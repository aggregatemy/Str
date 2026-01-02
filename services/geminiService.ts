/**
 * Serwis komunikacji z Google Gemini AI API.
 * 
 * @module geminiService
 * @description Moduł odpowiedzialny za komunikację z Google Gemini AI w celu:
 * - Pobierania i parsowania aktualizacji prawnych z oficjalnych źródeł
 * - Normalizacji danych do ustrukturyzowanego formatu JSON
 * - Generowania raportów faktograficznych
 * - Ekstrakcji linków weryfikacyjnych (grounding links)
 * 
 * Wykorzystuje Gemini 3 Pro Preview z Google Search grounding dla maksymalnej
 * faktograficzności i weryfikowalności danych.
 */

import { GoogleGenAI, Type } from "@google/genai";
import { LegalUpdate, GroundingLink, UserProfileType, IngestMethod } from "../types";

/**
 * Pobiera i parsuje aktualizacje prawne z oficjalnych źródeł.
 * 
 * @async
 * @function fetchSystemUpdates
 * @description Główna funkcja systemu ingestii danych. Wykorzystuje Gemini AI z Google Search
 * do wyszukania, parsowania i normalizacji aktów prawnych z oficjalnych źródeł polskich
 * instytucji państwowych (ISAP ELI, ZUS, CEZ, NFZ, e-Zdrowie).
 * 
 * Proces obejmuje:
 * 1. Konfiguracja klienta Gemini AI z kluczem API
 * 2. Utworzenie promptu z rygorystycznymi zasadami ekstrakacji faktograficznej
 * 3. Wywołanie Gemini z Google Search grounding
 * 4. Parsowanie odpowiedzi JSON do struktury LegalUpdate[]
 * 5. Ekstrakcja linków weryfikacyjnych z metadanych grounding
 * 6. Filtracja linków tylko do oficjalnych domen .gov.pl
 * 
 * @param {Array<{url: string, type: IngestMethod}>} sites - Lista źródeł do monitorowania
 * @param {string[]} topics - Tematy strategiczne do wyszukiwania
 * @param {UserProfileType} profile - Profil użytkownika (obecnie nieużywany, stały 'legal')
 * @param {'7d' | '30d' | '90d'} [range='7d'] - Zakres czasowy dla wyszukiwania
 * 
 * @returns {Promise<{updates: LegalUpdate[], links: GroundingLink[]}>} 
 * Obiekt zawierający:
 * - updates: Lista znormalizowanych aktualizacji prawnych
 * - links: Lista zweryfikowanych linków źródłowych
 * 
 * @throws {Error} Błąd podczas komunikacji z API lub parsowania danych
 * 
 * @example
 * const result = await fetchSystemUpdates(
 *   [{url: 'https://isap.sejm.gov.pl/api/eli', type: 'eli'}],
 *   ['Zarządzenia Prezesa NFZ', 'Ustawy zdrowotne'],
 *   'legal',
 *   '30d'
 * );
 * console.log(result.updates.length); // np. 15
 * console.log(result.links.length); // np. 8
 */
export const fetchSystemUpdates = async (
  sites: { url: string, type: IngestMethod }[], 
  topics: string[], 
  profile: UserProfileType,
  range: '7d' | '30d' | '90d' = '7d'
): Promise<{ updates: LegalUpdate[]; links: GroundingLink[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const model = 'gemini-3-pro-preview';

  /**
   * Prompt dla Gemini AI z rygorystycznymi zasadami ekstrakcji.
   * 
   * @constant
   * @type {string}
   * @description Strategia promptu zapewniająca:
   * - TOTALNĄ ELIMINACJĘ INTERPRETACJI - zakaz ocen wartościujących
   * - ZAKAZ ANALIZY SKUTKÓW - brak sugestii co użytkownik powinien zrobić
   * - EKSTRAKCJĘ 1:1 - przepisywanie danych bez zmian
   * - Specyficzne zasady dla każdego typu źródła (NFZ/ELI/RSS)
   * - Wymóg wypełnienia pola officialRationale tylko danymi źródłowymi
   * 
   * Prompt jest kluczowym elementem zapewniającym faktograficzny charakter systemu.
   */
  const prompt = `Jesteś BEZSTRONNYM AUTOMATEM FORMATUJĄCYM. 
  ZADANIE: Przekształć surowe dane wejściowe (HTML/XML/JSON) na format JSON.
  
  RYGORYSTYCZNE ZASADY:
  1. ZAKAZ DOKONYWANIA OCENY: Nie używaj słów takich jak "korzystny", "niekorzystny", "ważny", "trudny".
  2. ZAKAZ ANALIZY SKUTKÓW: Nie pisz co użytkownik musi zrobić.
  3. EKSTRAKCJA 1:1: Przepisuj dane z pól "Przedmiot zmiany", "Uzasadnienie" lub "Tytuł" w formie niezmienionej.
  4. NFZ SCRAPER: Z tabel NFZ wyciągaj tylko: Nr zarządzenia, Datę, Tytuł.
  5. ELI: Kopiuj status prawny bezpośrednio z deskryptora.
  6. POLE 'officialRationale': Wpisz tam wyłącznie oficjalne uzasadnienie ze źródła. Jeśli go nie ma, wpisz "Brak danych źródłowych".

  Tematy: ${topics.join(", ")}.
  Źródła: Tylko oficjalne domeny administracji publicznej.`;

  try {
    /**
     * Wywołanie Gemini AI z konfiguracją grounding i schema.
     * 
     * @description Konfiguracja wywołania obejmuje:
     * - tools: [{ googleSearch: {} }] - włączenie Google Search grounding
     * - responseMimeType: "application/json" - wymuszenie formatu JSON
     * - responseSchema - szczegółowa schema TypeScript dla walidacji odpowiedzi
     * 
     * Schema zapewnia:
     * - Poprawną strukturę danych LegalUpdate
     * - Walidację typów enum (ingestMethod, impact)
     * - Wymuszenie wymaganych pól
     * - Opcjonalność pola eliUri
     */
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            updates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  eliUri: { type: Type.STRING, nullable: true },
                  ingestMethod: { type: Type.STRING, enum: ['eli', 'rss', 'scraper'] },
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  date: { type: Type.STRING },
                  impact: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
                  category: { type: Type.STRING },
                  legalStatus: { type: Type.STRING },
                  officialRationale: { type: Type.STRING }
                },
                required: ["id", "ingestMethod", "title", "summary", "impact", "category", "date", "legalStatus", "officialRationale"]
              }
            }
          }
        }
      },
    });

    /**
     * Parsowanie odpowiedzi JSON.
     * 
     * @description Konwertuje odpowiedź tekstową na obiekt JavaScript.
     * W przypadku pustej odpowiedzi zwraca domyślną strukturę z pustą tablicą updates.
     */
    const result = JSON.parse(response.text?.trim() || '{"updates": []}');
    const links: GroundingLink[] = [];

    /**
     * Ekstrakcja linków weryfikacyjnych z metadanych grounding.
     * 
     * @description Przetwarza groundingMetadata z odpowiedzi Gemini AI:
     * - Iteruje przez groundingChunks
     * - Filtruje tylko linki z oficjalnych domen (.gov.pl, .zus.pl, .nfz.gov.pl)
     * - Tworzy obiekty GroundingLink z URI i tytułem
     * 
     * Te linki służą do weryfikacji źródeł użytych przez AI.
     */
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri && (chunk.web.uri.includes('.gov.pl') || chunk.web.uri.includes('.zus.pl') || chunk.web.uri.includes('.nfz.gov.pl'))) {
          links.push({ uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
        }
      });
    }

    return { updates: result.updates || [], links };
  } catch (error) {
    console.error("Błąd parsowania danych:", error);
    throw error;
  }
};

/**
 * Generuje raport faktograficzny z wybranych dokumentów.
 * 
 * @async
 * @function generateEmailBriefing
 * @description Tworzy surowe zestawienie faktograficzne z wybranych aktualizacji prawnych.
 * Wykorzystuje Gemini Flash (szybszy model) do formatowania danych bez dodawania
 * jakichkolwiek interpretacji, wstępów czy podsumowań.
 * 
 * Proces obejmuje:
 * 1. Agregacja danych z wybranych dokumentów (tytuł, ID/ELI, uzasadnienie)
 * 2. Utworzenie promptu z zakazem dodawania komentarzy
 * 3. Wywołanie Gemini Flash dla szybkiego przetworzenia
 * 4. Zwrócenie surowego tekstu raportu
 * 
 * @param {LegalUpdate[]} updates - Lista aktualizacji do uwzględnienia w raporcie
 * 
 * @returns {Promise<string>} Tekstowy raport faktograficzny gotowy do kopiowania
 * 
 * @throws {Error} Błąd podczas komunikacji z API lub generowania raportu
 * 
 * @example
 * const selectedUpdates = [update1, update2, update3];
 * const briefing = await generateEmailBriefing(selectedUpdates);
 * console.log(briefing); // Surowy tekst raportu
 * navigator.clipboard.writeText(briefing); // Kopiowanie do schowka
 */
export const generateEmailBriefing = async (updates: LegalUpdate[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  /**
   * Agregacja treści dokumentów do raportu.
   * 
   * @constant
   * @type {string}
   * @description Łączy dane z wybranych dokumentów w format:
   * DOKUMENT: [tytuł]
   * ID: [eliUri lub id]
   * TREŚĆ UZASADNIENIA: [officialRationale]
   * 
   * Dokumenty są rozdzielone separatorem "---".
   */
  const contentSummary = updates.map(u => `DOKUMENT: ${u.title}\nID: ${u.eliUri || u.id}\nTREŚĆ UZASADNIENIA: ${u.officialRationale}\n`).join('\n---\n');
  
  /**
   * Prompt dla generowania raportu.
   * 
   * @constant
   * @type {string}
   * @description Minimalistyczny prompt zabraniający dodawania jakichkolwiek
   * elementów poza surowymi danymi faktograficznymi. Żadnych wstępów, zakończeń,
   * analiz czy komentarzy.
   */
  const prompt = `Sformatuj poniższe dane do surowego zestawienia faktograficznego. 
  Zabrania się dodawania jakiegokolwiek komentarza, wstępu, zakończenia lub analizy.
  Tylko suche dane.\n${contentSummary}`;
  
  /**
   * Wywołanie Gemini Flash dla szybkiego przetworzenia.
   * 
   * @description Używa modelu gemini-3-flash-preview (szybszy, tańszy)
   * zamiast Pro, ponieważ zadanie jest prostsze i nie wymaga grounding.
   */
  const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
  return response.text || "";
};
