
import { GoogleGenAI } from "@google/genai";
import { Question } from "../types.ts";

// Função para obter a chave de API de forma segura
const getApiKey = () => {
  try {
    return process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

const apiKey = getApiKey();

export const getSergeantHint = async (question: Question): Promise<string> => {
  if (!apiKey) return "O rádio está fora de área! (Chave de API não configurada).";
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Aja como um Sargento Fuzileiro Naval instrutor rígido. Dê um 'Buzu' (dica sutil) para a seguinte questão de prova de cabo. Não diga a resposta. Use gírias militares brasileiras profissionais.
      Questão: ${question.text}
      Opções: ${question.options.join(', ')}`,
      config: {
        systemInstruction: "Você é o Sargento 'Buzu', um instrutor do Corpo de Fuzileiros Navais brasileiros.",
        temperature: 0.7,
      },
    });
    return response.text || "Recruta, preste atenção nas instruções de combate!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "O rádio está com interferência! Confie no seu estudo.";
  }
};

export const getMissionFeedback = async (score: number, won: boolean): Promise<string> => {
  if (!apiKey) return "Missão finalizada. AD SUMUS!";
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `O fuzileiro naval terminou sua missão com ${score} pontos. O resultado foi ${won ? "VITORIOSO" : "DERROTADO"}. Dê uma mensagem de incentivo militar curta.`,
    });
    return response.text || "Missão cumprida. AD SUMUS!";
  } catch (error) {
    return "AD SUMUS!";
  }
};
