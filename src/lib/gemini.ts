import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const summarizeDocument = async (text: string, mode: 'beginner' | 'exam' | 'ultra-short') => {
  const prompt = `Summarize the following academic content into simple, clear study notes for a university student. 
  Use easy English, short paragraphs, bullet points, and headings. 
  Include key concepts, definitions, explanations, examples, and revision points. 
  Keep it concise but do not lose important meaning.
  
  MODE: ${mode} mode
  
  CONTENT:
  ${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
};
