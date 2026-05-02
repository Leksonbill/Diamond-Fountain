import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface MovieRecommendation {
  title: string;
  year: string;
  reason: string;
  moodMatch: number;
}

export interface ScriptScene {
  heading: string;
  action: string;
  dialogue: { character: string; text: string }[];
}

export interface Script {
  title: string;
  genre: string;
  logline: string;
  characters: { name: string; description: string }[];
  scenes: ScriptScene[];
}

export async function generateScript(prompt: string): Promise<Script> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Write a compelling movie script based on: ${prompt}. Return a JSON object following the Script interface.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          genre: { type: Type.STRING },
          logline: { type: Type.STRING },
          characters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                heading: { type: Type.STRING },
                action: { type: Type.STRING },
                dialogue: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      character: { type: Type.STRING },
                      text: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          }
        },
        required: ["title", "genre", "logline", "characters", "scenes"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function getRecommendations(
  mood: string, 
  genre: string, 
  preferences: string[]
): Promise<MovieRecommendation[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Suggest 5 movie titles for someone feeling '${mood}' who likes '${genre}' movies. Consider these user preferences: ${preferences.join(", ")}. Return a JSON array of MovieRecommendation objects.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            year: { type: Type.STRING },
            reason: { type: Type.STRING },
            moodMatch: { type: Type.NUMBER, description: "Percentage match 0-100" }
          }
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateSpeech(text: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say with a professional, cinematic voice: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Speech generation failed:", error);
    return null;
  }
}
