
import { GoogleGenAI, Type } from "@google/genai";
import { LegalUpdate, GroundingLink } from "../types";

const API_KEY = process.env.API_KEY || "";

export const fetchLegalUpdates = async (sites: string[]): Promise<{ updates: LegalUpdate[]; links: GroundingLink[] }> => {
  if (!API_KEY) throw new Error("Brak klucza API Gemini.");

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = 'gemini-3-flash-preview';

  const sitesPrompt = sites.join(", ");
  const prompt = `Jesteś ekspertem ds. polskiego prawa i legislacji. Przeanalizuj najnowsze zmiany (ostatnie 30 dni) w kontekście źródeł: ${sitesPrompt}.
  Zwróć uwagę na ustawy, rozporządzenia i projekty w toku.
  Dla każdego elementu określ:
  - impact: 'low', 'medium' lub 'high' (wysoki dla zmian podatkowych, karnych lub dużych reform biznesowych).
  - checklist: 3-5 krótkich punktów "Co musisz zrobić?".
  - summary: jedno zdanie podsumowujące esencję zmiany.`;

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
                  impact: { type: Type.STRING },
                  category: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  checklist: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["id", "title", "description", "impact", "category", "date"]
              }
            }
          }
        }
      },
    });

    const result = JSON.parse(response.text || '{"updates": []}');
    const links: GroundingLink[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          links.push({ uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
        }
      });
    }

    return { updates: result.updates || [], links };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const getDetailedSummary = async (title: string, context: string): Promise<string> => {
  if (!API_KEY) throw new Error("Brak klucza API.");
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = 'gemini-3-flash-preview';

  const prompt = `Analiza pogłębiona aktu: "${title}". Kontekst: ${context}. Wyjaśnij przystępnym językiem konsekwencje dla małych firm i osób prywatnych. Użyj boldowania dla kluczowych dat.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "Błąd generowania.";
  } catch (error) {
    return "Wystąpił błąd.";
  }
};
