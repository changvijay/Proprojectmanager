import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY;

export const geminiService = {
  generateProjectPlan: async (projectName: string, description: string) => {
    if (!apiKey) return null;

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        Act as a senior project manager. 
        Given the project name "${projectName}" and description "${description}",
        generate a list of 5-8 initial high-level tasks to get the project started.
        Return the response in JSON format with a list of tasks.
        Each task should have a 'title' (string), 'description' (string), 'priority' (string: HIGH, MEDIUM, LOW), and 'status' (string: TODO).
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    status: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      const text = response.text;
      if (!text) return { tasks: [] };
      
      return JSON.parse(text);

    } catch (error) {
      console.error("Gemini API Error:", error);
      return { tasks: [] };
    }
  }
};