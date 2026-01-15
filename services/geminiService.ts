
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

const REMINDER_INSTRUCTION = `
Você deve redigir um e-mail de lembrete profissional para um técnico ou gerente.
O objetivo é avisar que um serviço começará em 1 hora.
Inclua: Nome do cliente, Tipo de serviço, Morada e Hora de início.
Seja breve e profissional.
`;

const CONFIRMATION_INSTRUCTION = `
Você deve redigir um e-mail de CONFIRMAÇÃO DE AGENDAMENTO para um cliente.
Seja extremamente cordial e profissional em Português de Portugal.
O e-mail deve confirmar o serviço, a data e a hora.
Assine como "Equipa Hidro Clean".
`;

/**
 * Função genérica para chamar a IA com tratamento de erro e fallback
 */
async function callGemini(prompt: string, instruction: string): Promise<string | null> {
  const apiKey = process.env.API_KEY;
  
  // Se não houver chave, retorna null para ativar o fallback local
  if (!apiKey || apiKey === "undefined" || apiKey.length < 10) {
    console.warn("Gemini API Key não configurada ou inválida. Usando fallback local.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: instruction,
        temperature: 0.7,
      },
    });
    return response.text || null;
  } catch (error) {
    console.error("Erro na chamada Gemini:", error);
    return null;
  }
}

export async function generateAIResponse(prompt: string): Promise<string> {
  const result = await callGemini(prompt, SYSTEM_INSTRUCTION);
  if (result) return result;

  // FALLBACK MANUAL para Respostas Gerais
  return `Olá! Agradecemos o contacto com a Hidro Clean. Relativamente ao seu pedido sobre "${prompt}", informamos que somos especialistas em pesquisa de fugas e desentupimentos. Sugerimos uma visita técnica para podermos dar um orçamento exato. Quando seria melhor para si?`;
}

export async function generateReminderEmail(apptData: any): Promise<string> {
  const prompt = `Gere um lembrete para o serviço: ${apptData.service_type} do cliente ${apptData.customer_name} na morada ${apptData.description} às ${apptData.start_time}.`;
  const result = await callGemini(prompt, REMINDER_INSTRUCTION);
  if (result) return result;

  // FALLBACK MANUAL para Lembrete
  return `LEMBRETE DE SERVIÇO - HIDRO CLEAN\n\nOlá, este é um lembrete de que o serviço de ${apptData.service_type} para o cliente ${apptData.customer_name} está agendado para daqui a 1 hora (${apptData.start_time}) na morada: ${apptData.description}.`;
}

export async function generateClientConfirmationEmail(appt: any): Promise<string> {
  const prompt = `Gere uma confirmação para o cliente ${appt.customer_name} sobre o serviço de ${appt.service_type} agendado para o dia ${appt.scheduled_at} às ${appt.start_time}.`;
  const result = await callGemini(prompt, CONFIRMATION_INSTRUCTION);
  if (result) return result;

  // FALLBACK MANUAL para Confirmação de Cliente
  const dataFormatada = new Date(appt.scheduled_at).toLocaleDateString('pt-PT');
  return `Assunto: Confirmação de Agendamento - Hidro Clean\n\nEstimado(a) ${appt.customer_name},\n\nConfirmamos com sucesso o agendamento do serviço de ${appt.service_type} para o dia ${dataFormatada} às ${appt.start_time}.\n\nA nossa equipa técnica entrará em contacto caso haja algum imprevisto. Agradecemos a preferência.\n\nMelhores cumprimentos,\nEquipa Hidro Clean`;
}
