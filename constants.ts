
import { Question, Difficulty } from './types';

const createQuestion = (
  id: string,
  text: string, 
  correct: string, 
  distractors: [string, string, string], 
  diff: Difficulty, 
  cat: string, 
  ref: string
): Question => {
  const options = [correct, ...distractors];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return {
    id,
    text,
    options,
    correctAnswer: options.indexOf(correct),
    difficulty: diff,
    category: cat,
    reference: ref
  };
};

export const INITIAL_QUESTIONS: Question[] = [
  // --- HISTÓRIA (PÁG 53-57) ---
  createQuestion('h1', 'Em que data a Brigada Real da Marinha aportou no Rio de Janeiro?', '7 de março de 1808', ['28 de agosto de 1797', '21 de março de 1809', '11 de junho de 1865'], Difficulty.RECRUTA, 'História', 'Pág 53'),
  createQuestion('h2', 'Qual o nome do Patrono do Corpo de Fuzileiros Navais?', 'Almirante Gastão Motta', ['Almirante Barroso', 'Marquês de Tamandaré', 'Almirante Rodrigo Pinto Guedes'], Difficulty.RECRUTA, 'História', 'Pág 74'),
  createQuestion('h3', 'Quem foi o herói da tomada da Praça Forte Paissandu, conhecido pelo heroísmo no "Forte Sebastopol"?', '2º SG Francisco Borges de Souza', ['Conde de Anadia', 'Almirante Rodrigo Pinto Guedes', 'Marquês de Olinda'], Difficulty.COMBATENTE, 'História', 'Pág 54'),
  createQuestion('h4', 'A Brigada Real da Marinha ocupou qual Fortaleza em 21 de março de 1809?', 'Fortaleza de São José na Ilha das Cobras', ['Fortaleza de Santa Cruz', 'Forte de Copacabana', 'Fortaleza de São João'], Difficulty.COMBATENTE, 'História', 'Pág 53'),

  // --- TRADIÇÕES E LINGUAGEM (PÁG 58-65) ---
  createQuestion('tr1', 'Na linguagem do mar, o que significa a expressão "ONÇA"?', 'Dificuldade ou situação de apuro', ['Militar muito antigo', 'Algo que corre bem', 'Sinal de silêncio'], Difficulty.RECRUTA, 'Tradições', 'Pág 65'),
  createQuestion('tr2', 'Como é denominado o quarto de serviço entre 04:00h e 08:00h?', 'Quarto d\'alva', ['Quarto de vigília', 'Quarto da manhã', 'Quarto de rendição'], Difficulty.RECRUTA, 'Tradições', 'Pág 58'),
  createQuestion('tr3', 'O que significa o termo "ROSCA FINA" na Marinha?', 'Superior exigente na observância de normas', ['Militar que trabalha mal', 'Cabo que ajuda os recrutas', 'Manutenção de armamento'], Difficulty.COMBATENTE, 'Tradições', 'Pág 65'),
  createQuestion('tr4', 'Qual a origem do lenço preto usado no pescoço do uniforme de marinheiro?', 'Evitava que o suor e a pólvora escorressem para os olhos', ['Sinal de luto pela Rainha', 'Identificação de praças de carreira', 'Proteção contra o frio'], Difficulty.ESPECIALISTA, 'Tradições', 'Pág 62'),

  // --- RDM E ESTATUTO (PÁG 17-42) ---
  createQuestion('rd1', 'Qual o prazo máximo permitido para uma pena de prisão simples ou rigorosa segundo o RDM?', '30 dias', ['10 dias', '15 dias', '45 dias'], Difficulty.COMBATENTE, 'RDM', 'Pág 23/39'),
  // Fixed rd2: wrapped distractors in brackets and ensured proper argument order for createQuestion
  createQuestion('rd2', 'Qual das alternativas abaixo é uma circunstância ATENUANTE da contravenção disciplinar?', 'Bons antecedentes militares', ['Reincidência', 'Conluio de duas ou mais pessoas', 'Premeditação'], Difficulty.COMBATENTE, 'RDM', 'Pág 36'),
  createQuestion('rd3', 'A quem compete privativamente impor a pena de "Dispensa das funções de atividade"?', 'Ministro da Marinha', ['Oficial de Serviço', 'Comandante da Unidade', 'Presidente da República'], Difficulty.ESPECIALISTA, 'RDM', 'Pág 38'),
  createQuestion('rd4', 'A partir de qual graduação as Praças adquirem estabilidade após 10 anos de serviço?', 'Cabo de carreira', ['Marinheiro recrutado', 'Soldado temporário', 'Recruta'], Difficulty.ESPECIALISTA, 'Estatuto', 'Pág 24'),

  // --- OGSA E SERVIÇO (PÁG 43-52 / 95-100) ---
  createQuestion('og1', 'Quem é a autoridade responsável pela disciplina e segurança da OM na ausência do Comandante e Imediato?', 'Oficial de Serviço', ['Sargento da Guarda', 'Cabo de Dia', 'Fiel de Quartel'], Difficulty.RECRUTA, 'OGSA', 'Pág 58'),
  createQuestion('og2', 'Qual o tempo máximo de serviço de sentinela dentro de um período de 24 horas?', '8 horas', ['2 horas', '4 horas', '12 horas'], Difficulty.COMBATENTE, 'OGSA', 'Pág 52'),
  createQuestion('og3', 'Na ausência do Comandante da Guarda, quem exerce suas funções?', 'Cabo da Guarda', ['Sargento de Dia', 'Mensageiro', 'Plantão'], Difficulty.RECRUTA, 'OGSA', 'Pág 51'),

  // --- TÁTICA E COMBATE (PÁG 127-166) ---
  createQuestion('ta1', 'No estudo do terreno (OCOAV), o que significa a sigla "C"?', 'Cobertas e Abrigos', ['Comando', 'Comunicação', 'Crista Militar'], Difficulty.COMBATENTE, 'Tática', 'Pág 128'),
  createQuestion('ta2', 'Qual a distância de exposição máxima recomendada em um lanço de marcha acelerada?', '15 metros', ['5 metros', '30 metros', '50 metros'], Difficulty.COMBATENTE, 'Tática', 'Pág 148'),
  createQuestion('ta3', 'Qual a principal diferença entre COBERTA e ABRIGO?', 'Coberta protege contra vistas; Abrigo protege contra fogos', ['Coberta é natural; Abrigo é artificial', 'Não há diferença técnica', 'Abrigo é apenas para oficiais'], Difficulty.RECRUTA, 'Tática', 'Pág 141/142'),
  createQuestion('ta4', 'O que caracteriza a "CRISTA MILITAR" de uma elevação?', 'Permite observar a base da encosta sem ângulos mortos', ['É o ponto geográfico mais alto', 'É a zona de reunião no topo', 'É a face voltada para o mar'], Difficulty.ESPECIALISTA, 'Tática', 'Pág 131'),

  // --- OPERAÇÕES ANFÍBIAS (PÁG 167-182) ---
  createQuestion('oa1', 'Qual a fase da OpAnf onde ocorrem os "Briefings" e o teste do cronograma?', 'Ensaio', ['Planejamento', 'Embarque', 'Travessia'], Difficulty.COMBATENTE, 'OpAnf', 'Pág 168'),
  createQuestion('oa2', 'Qual documento o FN recebe no embarque contendo seu beliche e equipe de embarcação?', 'Cartão de Embarque', ['Ordem de Serviço', 'Guia de Marcha', 'Manifesto'], Difficulty.RECRUTA, 'OpAnf', 'Pág 169'),
  createQuestion('oa3', 'Em caso de afundamento do CLAnf, qual o procedimento correto se houver bolsão de ar?', 'Permanecer calmo e sair pela escotilha de pessoal quando alagar', ['Abrir imediatamente a escotilha de carga', 'Inflar o colete dentro da viatura', 'Abandonar a arma e nadar'], Difficulty.ESPECIALISTA, 'OpAnf', 'Pág 176'),

  // --- LIDERANÇA (PÁG 76-84) ---
  createQuestion('li1', 'Qual o nome da rosa dos ventos que contém as virtudes militares do CFN?', 'Rosa das Virtudes', ['Rosa do Comando', 'Rosa da Honra', 'Círculo de Ferro'], Difficulty.RECRUTA, 'Liderança', 'Pág 78'),
  createQuestion('li2', 'A capacidade de decidir sem depender de ordem superior diante de situações inesperadas é:', 'Iniciativa', ['Competência', 'Responsabilidade', 'Dever'], Difficulty.RECRUTA, 'Liderança', 'Pág 80'),
  createQuestion('li3', 'No processo de liderança, o que significa a variável "SITUAÇÃO"?', 'O cenário e o nível de estresse onde ocorre a interação', ['O posto do oficial', 'A ordem do Comandante', 'O tempo de serviço'], Difficulty.COMBATENTE, 'Liderança', 'Pág 78'),
];

export const PRIZE_LEVELS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600];
export const RANKS = ['Ferro', 'Bronze', 'Prata', 'Ouro', 'Platina', 'Esmeralda', 'Diamante', 'Mestre', 'Grão-Mestre'];
