
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
  // Verificação segura para evitar erro de 'process is not defined'
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : (window as any).API_KEY;
  
  if (!apiKey) {
    console.error("API_KEY não encontrada nas variáveis de ambiente.");
    return "Erro: Chave de API não configurada.";
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

    return response.text || "Desculpe, não consegui gerar a resposta.";
  } catch (error) {
    console.error("Erro na IA:", error);
    throw new Error("Falha na comunicação com o assistente.");
  }
}
