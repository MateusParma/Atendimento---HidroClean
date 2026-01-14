
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Você é o assistente oficial de IA da "Hidro Clean Canalizações" (Portugal).
Sua tarefa é gerar respostas curtas, profissionais e cordiais para clientes.
Serviços principais: Pesquisa de fugas de água (sem partir), Desentupimentos, Limpeza de fossas e Inspeções de vídeo.
Diretrizes:
- Use Português de Portugal (PT-PT).
- Seja direto e proativo.
- Sempre sugira uma visita técnica para orçamentos precisos.
- Mencione que somos rápidos e deixamos tudo limpo.
`;

export async function generateAIResponse(prompt: string): Promise<string> {
  // Initialize with named parameter as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    // Using ai.models.generateContent directly
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    // Accessing .text property directly (not a function)
    return response.text || "Desculpe, não consegui gerar a resposta.";
  } catch (error) {
    console.error("Erro na IA:", error);
    throw new Error("Falha na comunicação com o assistente.");
  }
}
