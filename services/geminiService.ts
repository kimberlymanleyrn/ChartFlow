
import { GoogleGenAI, Type } from "@google/genai";
import { DocumentationType, DocumentationResult } from "../types";

const SYSTEM_INSTRUCTION = `You are an expert Registered Nurse and clinical documentation specialist. 
Your task is to transform messy, shorthand, or handwritten nursing notes into structured, professional, and HIPAA-compliant clinical documentation.

Rules:
1. Preserve all clinical findings but use professional medical terminology (e.g., instead of "pt has crackles in lungs", use "auscultated bibasilar inspiratory crackles").
2. Ensure documentation is objective and specific.
3. If specific patient names are provided, replace them with "Patient" to maintain privacy.
4. Follow the structure of the requested format (SOAP, SBAR, etc.).
5. Use bullet points where appropriate for clarity.
6. The output should be ready for an Electronic Health Record (EHR) entry.`;

export const processNursingNotes = async (
  input: string | { data: string; mimeType: string },
  docType: DocumentationType
): Promise<DocumentationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `Transform the following nursing notes into a professional ${docType} format. 
  Notes: ${typeof input === 'string' ? input : 'Please analyze the attached image of handwritten notes.'}`;

  const contents = typeof input === 'string' 
    ? prompt 
    : {
        parts: [
          { inlineData: input },
          { text: prompt }
        ]
      };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
          },
          required: ["title", "content"]
        }
      },
    });

    const result = JSON.parse(response.text || '{}');
    return {
      title: result.title || `${docType} Note`,
      content: result.content || "Processing failed. Please try again.",
      type: docType,
      timestamp: new Date().toLocaleString()
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to process notes. Please ensure your input is legible.");
  }
};
