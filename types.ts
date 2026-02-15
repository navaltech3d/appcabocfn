
export enum Difficulty {
  RECRUTA = 'Recruta (Fácil)',
  COMBATENTE = 'Combatente (Médio)',
  ESPECIALISTA = 'Especialista (Difícil)',
  ELITE = 'Elite (Muito Difícil)'
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  difficulty: Difficulty;
  category: string;
  reference: string; 
  bizu: string; // Hint directly attached to the question
}

export interface User {
  nickname: string;
  phone: string;
  score: number;
  rank: string;
  lastPlayed: number;
  isAdmin: boolean;
  seenQuestionIds: string[]; 
}

export interface RankingEntry {
  nickname: string;
  phone?: string;
  score: number;
  rank: string;
  updated_at?: string;
}

export type AppView = 'login' | 'menu' | 'game' | 'ranking' | 'admin' | 'gameOver' | 'correction';
