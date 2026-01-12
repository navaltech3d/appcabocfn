
import { GoogleGenAI } from "@google/genai";

// Função auxiliar para obter a chave de forma segura em diferentes contextos
const getApiKey = () => {
  try {
    return (globalThis as any).process?.env?.API_KEY || (process as any)?.env?.API_KEY;
  } catch (e) {
    return null;
  }
};

/**
 * O Bizu SG agora é estático e vem diretamente do banco de questões (constants.ts)
 * para evitar falhas de API no ambiente Vercel.
 */

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
