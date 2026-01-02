
import { GoogleGenAI, Type } from "@google/genai";
import { LegalUpdate, GroundingLink, UserProfileType, IngestMethod } from "../types";

export const fetchSystemUpdates = async (
  sites: { url: string, type: IngestMethod }[], 
  topics: string[], 
  profile: UserProfileType,
  range: '7d' | '30d' | '90d' = '7d'
): Promise<{ updates: LegalUpdate[]; links: GroundingLink[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const model = 'gemini-3-pro-preview';

  // TOTALNA ELIMINACJA INTERPRETACJI
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

    const result = JSON.parse(response.text?.trim() || '{"updates": []}');
    const links: GroundingLink[] = [];
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

export const generateEmailBriefing = async (updates: LegalUpdate[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const contentSummary = updates.map(u => `DOKUMENT: ${u.title}\nID: ${u.eliUri || u.id}\nTREŚĆ UZASADNIENIA: ${u.officialRationale}\n`).join('\n---\n');
  const prompt = `Sformatuj poniższe dane do surowego zestawienia faktograficznego. 
  Zabrania się dodawania jakiegokolwiek komentarza, wstępu, zakończenia lub analizy.
  Tylko suche dane.\n${contentSummary}`;
  
  const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
  return response.text || "";
};
