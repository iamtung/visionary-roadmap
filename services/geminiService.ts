import { GoogleGenAI, Type } from "@google/genai";
import { Task } from "../types";

export const generateRoadmapSuggestions = async (
  productDescription: string
): Promise<Omit<Task, 'id'>[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are an expert Product Manager.
    Generate a list of 5-8 realistic roadmap tasks for a product described as: "${productDescription}".
    
    The tasks should cover different categories like "frontend", "backend", "design", "marketing".
    
    Return a JSON array of objects.
    Each object must have:
    - name: string (Task title)
    - description: string (Short description)
    - category: string (One of: frontend, backend, design, marketing)
    - startWeek: integer (Between 1 and 40, varied start times)
    - durationWeeks: integer (Between 1 and 12)
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              startWeek: { type: Type.INTEGER },
              durationWeeks: { type: Type.INTEGER },
            },
            required: ["name", "description", "category", "startWeek", "durationWeeks"],
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as Omit<Task, 'id'>[];
    }
    return [];
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};