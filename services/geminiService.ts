
import { GoogleGenAI } from "@google/genai";
import { Question } from "../types.ts";

// Função auxiliar para obter a chave de forma segura em diferentes contextos
const getApiKey = () => {
  try {
    // Tenta obter do process.env injetado
    return (globalThis as any).process?.env?.API_KEY || (process as any)?.env?.API_KEY;
  } catch (e) {
    return null;
  }
};

export const getSergeantHint = async (question: Question): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.warn("API_KEY não encontrada no ambiente.");
    return "O rádio está com interferência (Falta sinal de API)! Confie no seu instinto, combatente.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Aja como um Sargento Fuzileiro Naval instrutor rígido do Brasil. Dê um 'Buzu' (dica militar) para a seguinte questão de prova de cabo. Não diga a resposta. Use terminologia militar profissional.
      Questão: ${question.text}
      Opções: ${question.options.join(', ')}`,
      config: {
        systemInstruction: "Você é o Sargento 'Buzu', um instrutor do Corpo de Fuzileiros Navais brasileiros focado em preparar cabos para a excelência técnica.",
        temperature: 0.7,
      },
    });
    
    return response.text || "Recruta, preste atenção nas instruções de combate!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Interferência no rádio (Erro de Processamento)! Siga seu treinamento.";
  }
};

export const getMissionFeedback = async (score: number, won: boolean): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "AD SUMUS!";

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `O fuzileiro naval terminou sua missão com ${score} pontos. O resultado foi ${won ? "VITORIOSO" : "DERROTADO"}. Dê uma mensagem de incentivo militar curta e impactante.`,
      config: {
        systemInstruction: "Você é um Comandante do CFN motivando sua tropa após o combate.",
      }
    });
    return response.text || "Missão cumprida. AD SUMUS!";
  } catch (error) {
    return "AD SUMUS!";
  }
};
