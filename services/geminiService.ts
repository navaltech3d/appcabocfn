
import { GoogleGenAI } from "@google/genai";
import { Question } from "../types.ts";

export const getSergeantHint = async (question: Question): Promise<string> => {
  try {
    // Inicialização direta para garantir captura correta da variável de ambiente injetada
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Aja como um Sargento Fuzileiro Naval instrutor rígido. Dê um 'Buzu' (dica sutil) para a seguinte questão de prova de cabo. Não diga a resposta. Use gírias militares brasileiras profissionais.
      Questão: ${question.text}
      Opções: ${question.options.join(', ')}`,
      config: {
        systemInstruction: "Você é o Sargento 'Buzu', um instrutor do Corpo de Fuzileiros Navais brasileiros focado em preparar cabos.",
        temperature: 0.7,
      },
    });
    
    return response.text || "Recruta, preste atenção nas instruções de combate!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "O rádio está com interferência (Erro de Conexão)! Confie no seu estudo e siga a missão.";
  }
};

export const getMissionFeedback = async (score: number, won: boolean): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `O fuzileiro naval terminou sua missão com ${score} pontos. O resultado foi ${won ? "VITORIOSO" : "DERROTADO"}. Dê uma mensagem de incentivo militar curta e impactante.`,
      config: {
        systemInstruction: "Você é um Comandante do CFN motivando sua tropa.",
      }
    });
    return response.text || "Missão cumprida. AD SUMUS!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AD SUMUS!";
  }
};
