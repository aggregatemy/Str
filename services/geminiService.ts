
import { GoogleGenAI, Type } from "@google/genai";
import { LegalUpdate, GroundingLink } from "../types";

const API_KEY = process.env.API_KEY || "";

export const fetchLegalUpdates = async (sites: string[]): Promise<{ updates: LegalUpdate[]; links: GroundingLink[] }> => {
  if (!API_KEY) {
    throw new Error("Brak klucza API Gemini.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = 'gemini-3-flash-preview';

  const sitesPrompt = sites.join(", ");
  const prompt = `Przeanalizuj najnowsze zmiany w prawie (z ostatnich 30 dni) na podstawie następujących źródeł lub w ich kontekście: ${sitesPrompt}. 
  Zidentyfikuj konkretne akty prawne, rozporządzenia lub projekty. 
  Dla każdej istotnej zmiany przygotuj obiekt zawierający tytuł, opis, kategorię (np. Podatki, Praca, Zdrowie, Biznes, Inne), przewidywany wpływ (low, medium, high) oraz datę.`;

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
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  date: { type: Type.STRING },
                  impact: { 
                    type: Type.STRING,
                    description: "Wartości: 'low', 'medium', 'high'"
                  },
                  category: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  sourceUrl: { type: Type.STRING }
                },
                required: ["id", "title", "description", "impact", "category", "date"]
              }
            }
          }
        }
      },
    });

    const result = JSON.parse(response.text || '{"updates": []}');
    const updates: LegalUpdate[] = result.updates || [];
    
    // Extract grounding links
    const links: GroundingLink[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          links.push({
            uri: chunk.web.uri,
            title: chunk.web.title || chunk.web.uri
          });
        }
      });
    }

    return { updates, links };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const getDetailedSummary = async (title: string, context: string): Promise<string> => {
  if (!API_KEY) throw new Error("Brak klucza API.");
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = 'gemini-3-flash-preview';

  const prompt = `Przygotuj bardzo szczegółowe, przystępne podsumowanie i wyjaśnienie następującej zmiany prawnej: "${title}". 
  Kontekst: ${context}. 
  Wyjaśnij: 
  1. Kogo dokładnie dotyczy ta zmiana? 
  2. Jakie są główne konsekwencje praktyczne? 
  3. Jakie są terminy? 
  Odpowiedz w języku polskim, używając Markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "Nie udało się wygenerować szczegółowego podsumowania.";
  } catch (error) {
    console.error("Detailed Summary Error:", error);
    return "Wystąpił błąd podczas generowania podsumowania.";
  }
};
