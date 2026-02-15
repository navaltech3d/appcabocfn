
import { GoogleGenAI } from "@google/genai";

/**
 * Fornece feedback motivacional baseado no desempenho da missão.
 */
export const getMissionFeedback = async (score: number, won: boolean): Promise<string> => {
  if (!process.env.API_KEY) return "AD SUMUS!";

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `O fuzileiro naval terminou sua missão com ${score} pontos. O resultado foi ${won ? "VITORIOSO" : "DERROTADO"}. Dê uma mensagem de incentivo militar curta e impactante.`,
      config: {
        systemInstruction: "Você é um Comandante do Corpo de Fuzileiros Navais motivando sua tropa após o combate. Seja breve, direto e use termos militares brasileiros.",
      }
    });
    return response.text || "Missão cumprida. AD SUMUS!";
  } catch (error) {
    console.warn('Erro na IA:', error);
    return "AD SUMUS!";
  }
};
