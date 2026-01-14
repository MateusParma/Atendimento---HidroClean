
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Você é o assistente oficial de IA da "Hidro Clean Canalizações" (Portugal).
Gere respostas curtas e proativas em PT-PT. Sugira sempre visita técnica.
`;

export async function generateAIResponse(prompt: string): Promise<string> {
  let apiKey = '';
  
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      apiKey = process.env.API_KEY;
    } else if ((window as any).API_KEY) {
      apiKey = (window as any).API_KEY;
    }
  } catch (e) {
    console.warn("Ambiente sem acesso a variáveis de processo.");
  }

  if (!apiKey) {
    return "Erro: Configuração de API pendente no servidor.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text || "Sem resposta da IA.";
  } catch (error) {
    console.error("AI Service Error:", error);
    throw new Error("Falha ao gerar resposta.");
  }
}
