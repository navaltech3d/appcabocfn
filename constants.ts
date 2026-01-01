
import { Question, Difficulty } from './types';

export const INITIAL_QUESTIONS: Question[] = [
  // História e Antecedentes
  { id: '1', text: 'Em que data foi criada a Brigada Real da Marinha em Lisboa?', options: ['28 de agosto de 1797', '7 de março de 1808', '21 de março de 1809', '11 de junho de 1864'], correctAnswer: 0, difficulty: Difficulty.RECRUTA, category: 'História' },
  { id: '2', text: 'Qual Fortaleza foi ocupada pela Brigada Real ao chegar no Brasil em 1809?', options: ['Fortaleza de Santa Cruz', 'Fortaleza de São José', 'Forte de Copacabana', 'Laje de Santos'], correctAnswer: 1, difficulty: Difficulty.RECRUTA, category: 'História' },
  { id: '3', text: 'Quem era o Ministro da Marinha que determinou a ocupação da Ilha das Cobras em 1809?', options: ['Almirante Tamandaré', 'Conde de Anadia', 'Almirante Barroso', 'Gastão Motta'], correctAnswer: 1, difficulty: Difficulty.COMBATENTE, category: 'História' },
  { id: '4', text: 'O CFN originou-se de qual unidade portuguesa de 1618?', options: ['Terço da Armada', 'Brigada de Ferro', 'Corpo de Fuzileiros', 'Regimento Naval'], correctAnswer: 0, difficulty: Difficulty.COMBATENTE, category: 'História' },
  { id: '5', text: 'Em que ano o CFN recebeu sua denominação atual?', options: ['1847', '1908', '1924', '1932'], correctAnswer: 3, difficulty: Difficulty.RECRUTA, category: 'História' },
  
  // Cerimonial
  { id: '6', text: 'A que horas é feito o hasteamento da Bandeira Nacional?', options: ['07:00h', '08:00h', '09:00h', 'Ao nascer do sol'], correctAnswer: 1, difficulty: Difficulty.RECRUTA, category: 'Cerimonial' },
  { id: '7', text: 'Qual o número de "boys" para as honras de um Almirante-de-Esquadra?', options: ['2', '4', '6', '8'], correctAnswer: 3, difficulty: Difficulty.COMBATENTE, category: 'Cerimonial' },
  { id: '8', text: 'O galhardete "Prep" é içado quanto tempo antes do cerimonial da bandeira?', options: ['1 minuto', '5 minutos', '10 minutos', '15 minutos'], correctAnswer: 1, difficulty: Difficulty.ESPECIALISTA, category: 'Cerimonial' },
  { id: '9', text: 'Qual bandeira é mantida hasteada permanentemente em tempo de guerra nos hospitais?', options: ['Bandeira do Brasil', 'Bandeira do Cruzeiro', 'Bandeira da Cruz Vermelha', 'Bandeira de Sinais'], correctAnswer: 2, difficulty: Difficulty.COMBATENTE, category: 'Cerimonial' },
  
  // Estatuto e RDM
  { id: '10', text: 'Qual a lei que dispõe sobre o Estatuto dos Militares?', options: ['Lei 4.375', 'Lei 6.880', 'Lei 13.954', 'Decreto 88.545'], correctAnswer: 1, difficulty: Difficulty.COMBATENTE, category: 'Estatuto' },
  { id: '11', text: 'As penas disciplinares de prisão não podem ultrapassar quantos dias?', options: ['10 dias', '20 dias', '30 dias', '45 dias'], correctAnswer: 2, difficulty: Difficulty.COMBATENTE, category: 'RDM' },
  { id: '12', text: 'Qual o valor máximo do cômputo do comportamento militar?', options: ['10 pontos', '50 pontos', '100 pontos', '1000 pontos'], correctAnswer: 2, difficulty: Difficulty.RECRUTA, category: 'RDM' },
  { id: '13', text: 'O que significa a expressão "Ad Sumus"?', options: ['Sempre prontos', 'Estamos presentes', 'Fiel até a morte', 'Força e Honra'], correctAnswer: 1, difficulty: Difficulty.RECRUTA, category: 'Doutrina' },
  
  // Organização do GC (Pág 196)
  { id: '14', text: 'Quantos militares compõem um Grupo de Combate (GC) completo?', options: ['9', '11', '13', '15'], correctAnswer: 2, difficulty: Difficulty.RECRUTA, category: 'Organização' },
  { id: '15', text: 'Quem é o comandante de uma Esquadra de Tiro (ET)?', options: ['Sargento', 'Cabo', 'Soldado antigo', 'Suboficial'], correctAnswer: 1, difficulty: Difficulty.RECRUTA, category: 'Organização' },
  { id: '16', text: 'Quantas Esquadras de Tiro compõem um GC?', options: ['2', '3', '4', '5'], correctAnswer: 1, difficulty: Difficulty.RECRUTA, category: 'Organização' },
  { id: '17', text: 'Qual o armamento orgânico do Atirador da ET?', options: ['Fuzil IA2', 'Pistola 9mm', 'Metralhadora MINIMI', 'Lança-rojão AT-4'], correctAnswer: 2, difficulty: Difficulty.COMBATENTE, category: 'Armamento' },
  
  // Táticas e Terreno
  { id: '18', text: 'O que significa a sigla OCOAV no estudo do terreno?', options: ['Observação, Cobertas, Obstáculos, Acidentes, Vias de Acesso', 'Operação, Comando, Ordem, Ataque, Vigilância', 'Organização, Comunicação, Objetivo, Apoio, Valor', 'Nenhuma das anteriores'], correctAnswer: 0, difficulty: Difficulty.ESPECIALISTA, category: 'Tática' },
  { id: '19', text: 'Qual a distância limite da observação aproximada?', options: ['500m', '1000m', '2000m', '4000m'], correctAnswer: 2, difficulty: Difficulty.ESPECIALISTA, category: 'Tática' },
  { id: '20', text: 'O que é "coberta" no conceito militar?', options: ['Proteção contra fogos', 'Proteção contra observação', 'Camuflagem de rede', 'Abrigo de concreto'], correctAnswer: 1, difficulty: Difficulty.COMBATENTE, category: 'Tática' },
  
  // Liderança e Ética
  { id: '21', text: 'Qual o fundamento da Rosa das Virtudes que fala sobre a aceitação dos riscos?', options: ['Coragem', 'Abnegação', 'Zelo', 'Espírito de Sacrifício'], correctAnswer: 0, difficulty: Difficulty.COMBATENTE, category: 'Liderança' },
  { id: '22', text: 'A "Guerra de Atrito" foca principalmente em quê?', options: ['Manobra psicológica', 'Destruição cumulativa dos meios físicos', 'Aproximação indireta', 'Ciberguerra'], correctAnswer: 1, difficulty: Difficulty.ESPECIALISTA, category: 'Doutrina' },
  { id: '23', text: 'Quem é o Patrono do CFN?', options: ['Almirante Barroso', 'Almirante Tamandaré', 'Almirante Gastão Motta', 'Marquês de Tamandaré'], correctAnswer: 2, difficulty: Difficulty.RECRUTA, category: 'História' },
  { id: '24', text: 'Qual a cor tradicional do uniforme de verão do Fuzileiro Naval?', options: ['Branco', 'Azul Marinho', 'Bege', 'Cinza'], correctAnswer: 2, difficulty: Difficulty.RECRUTA, category: 'Tradições' },
  { id: '25', text: 'Em um navio, onde o Comandante dirige a manobra?', options: ['Tijupá', 'Passadiço', 'Castelo', 'Tombadilho'], correctAnswer: 1, difficulty: Difficulty.COMBATENTE, category: 'Linguagem do Mar' }
  // Nota: O sistema simula um banco de 500 questões. No código real, este array seria preenchido com o conteúdo completo.
];

export const PRIZE_LEVELS = [
  100, 200, 300, 400, 500, 
  600, 700, 800, 900, 1000, 
  1100, 1200, 1300, 1400, 1500, 
  1600
];

export const RANKS = [
  'Ferro',
  'Bronze',
  'Prata',
  'Ouro',
  'Platina',
  'Esmeralda',
  'Diamante',
  'Mestre',
  'Grão-Mestre'
];
