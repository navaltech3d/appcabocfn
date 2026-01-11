
import { Question, Difficulty } from './types.ts';

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
  // --- CERIMONIAL (PÁGS 11-16) ---
  createQuestion('c1', 'Segundo o Art. 1-1-4 do Cerimonial, o que define a "Cadeia de Comando"?', 'A sucessão de comandos vinculados a um comando superior, por subordinação militar, em ordem imediata e direta.', ['A hierarquia baseada exclusivamente no tempo de serviço e idade do militar.', 'A organização dos quartéis de acordo com a proximidade geográfica.', 'A divisão entre oficiais generais e oficiais subalternos em tempo de guerra.'], Difficulty.COMBATENTE, 'Cerimonial', 'Art. 1-1-4 / Pág 11'),
  createQuestion('c2', 'De acordo com o Art. 1-1-7, em qual circunstância NÃO são prestadas honras?', 'Durante o Cerimonial à Bandeira.', ['Em visitas oficiais de autoridades estrangeiras.', 'Ao pôr do sol em dias de Grande Gala.', 'Em solenidades de formatura de recrutas.'], Difficulty.COMBATENTE, 'Cerimonial', 'Art. 1-1-7 / Pág 11'),
  createQuestion('c3', 'No Cerimonial à Bandeira (Art. 2-2-4), a que horas o galhardete "Prep" é arriado e anunciado "Arriou"?', 'Às 08:00h ou quando do pôr do sol.', ['Às 07:55h no hasteamento.', 'Exatamente cinco minutos após o Hino Nacional.', 'Meio-dia nos dias de Pequena Gala.'], Difficulty.ESPECIALISTA, 'Cerimonial', 'Art. 2-2-4 / Pág 13'),
  createQuestion('c4', 'Segundo o Art. 5-1-8, quantos "boys" compõem a guarda na recepção de um Contra-Almirante?', 'Seis "boys".', ['Oito "boys".', 'Quatro "boys".', 'Dois "boys".'], Difficulty.COMBATENTE, 'Cerimonial', 'Art. 5-1-8 / Pág 16'),

  // --- ESTATUTO DOS MILITARES (PÁGS 17-31) ---
  createQuestion('e1', 'Conforme o Art. 3º do Estatuto, quem são os militares considerados "na ativa"?', 'Os de carreira, temporários, componentes da reserva convocados e alunos de órgãos de formação.', ['Apenas os militares de carreira com estabilidade assegurada.', 'Militares da reserva remunerada e os reformados por tempo de serviço.', 'Integrantes da Marinha Mercante em tempo de paz.'], Difficulty.COMBATENTE, 'Estatuto', 'Art. 3º / Pág 17'),
  createQuestion('e2', 'Qual o conceito de "Disciplina" segundo o Art. 14º § 2º do Estatuto?', 'Rigorosa observância e acatamento integral das leis, regulamentos e normas que fundamentam o organismo militar.', ['A subordinação cega a qualquer ordem, mesmo que manifestamente ilegal.', 'O respeito mútuo entre civis e militares em áreas sob administração naval.', 'A aplicação constante de punições para correção de atitudes do recruta.'], Difficulty.RECRUTA, 'Estatuto', 'Art. 14º / Pág 18'),
  createQuestion('e3', 'Segundo o Art. 27º, qual destas é uma manifestação essencial do valor militar?', 'O espírito de corpo, orgulho do militar pela organização onde serve.', ['A busca por promoção baseada apenas na antiguidade.', 'O cumprimento de ordens somente em situações de combate real.', 'A intimidade entre superiores e subordinados no serviço.'], Difficulty.RECRUTA, 'Estatuto', 'Art. 27º / Pág 20'),
  createQuestion('e4', 'De acordo com o Art. 50º, a estabilidade das praças ocorre após quantos anos de efetivo serviço?', '10 (dez) anos.', ['5 (cinco) anos.', '8 (oito) anos.', '20 (vinte) anos.'], Difficulty.RECRUTA, 'Estatuto', 'Art. 50º / Pág 24'),

  // --- RDM (PÁGS 32-42) ---
  createQuestion('r1', 'Qual a definição de contravenção disciplinar segundo o Art. 6º do RDM?', 'Toda ação ou omissão contrária às obrigações ou deveres militares, desde que não capitulada como crime.', ['Qualquer crime previsto no Código Penal Militar cometido por praça.', 'O desrespeito a leis civis cometido fora do expediente do quartel.', 'A falta de zelo com o fardamento durante o período de licença.'], Difficulty.COMBATENTE, 'RDM', 'Art. 6º / Pág 32'),
  createQuestion('r2', 'Segundo o Art. 47º § 1º do RDM, as penas de impedimento, detenção ou prisão não podem ultrapassar:', '30 (trinta) dias.', ['15 (quinze) dias.', '10 (dez) dias.', '45 (quarenta e cinco) dias.'], Difficulty.RECRUTA, 'RDM', 'Art. 47º / Pág 23/32'),
  createQuestion('r3', 'Conforme o Art. 10º, é considerada uma circunstância AGRAVANTE da contravenção:', 'Ter cometido a falta em presença de subordinado.', ['Bons antecedentes militares.', 'Idade menor de 18 anos.', 'Provocação por parte de superior.'], Difficulty.COMBATENTE, 'RDM', 'Art. 10º / Pág 35'),

  // --- OGSA (PÁGS 43-52) ---
  createQuestion('o1', 'As Organizações Militares (OM) de terra são estruturadas com base em quais documentos fundamentais?', 'Ato de Criação, Regulamento e Regimento Interno.', ['Tabela de Lotação, Plano de Carreira e Estatuto.', 'Manual de Liderança, RDM e Código Penal Militar.', 'Ato de Designação, Regulamento e Ordem de Serviço.'], Difficulty.COMBATENTE, 'OGSA', 'Art. 2-1-6 / Pág 43'),
  createQuestion('o2', 'Segundo a OGSA (Art. 4-1-3), todos são individualmente responsáveis dentro de sua esfera de ação, EXCETO:', 'Pelos danos causados por força maior devidamente comprovada.', ['Por imperícia na direção ou execução de fainas.', 'Por negligência ou imprudência no dever.', 'Por prejuízos causados à Fazenda Nacional.'], Difficulty.COMBATENTE, 'OGSA', 'Art. 4-1-3 / Pág 45'),

  // --- HISTÓRICO E TRADIÇÕES (PÁGS 53-65) ---
  createQuestion('h1', 'Em que data a Brigada Real da Marinha foi criada em Lisboa?', '28 de agosto de 1797.', ['7 de março de 1808.', '21 de março de 1809.', '16 de dezembro de 1618.'], Difficulty.RECRUTA, 'Histórico', 'Pág 53'),
  createQuestion('h2', 'Qual fortaleza a Brigada Real da Marinha ocupou ao chegar ao Brasil em 1809?', 'Fortaleza de São José na Ilha das Cobras.', ['Fortaleza de Santa Cruz.', 'Fortaleza de São João.', 'Forte de Copacabana.'], Difficulty.RECRUTA, 'Histórico', 'Pág 53'),
  createQuestion('t1', 'Na linguagem do mar, o que significa o termo "ONÇA"?', 'Dificuldade ou situação de apuro.', ['Militar muito antigo e experiente.', 'Algo que corre bem e sem obstáculos.', 'Sinal sonoro feito pelo Sino de Bordo.'], Difficulty.RECRUTA, 'Tradições', 'Pág 65'),
  createQuestion('t2', 'O quarto de serviço compreendido entre 04:00h e 08:00h é denominado:', 'Quarto d\'alva.', ['Quarto de vigília.', 'Quarto de rendição.', 'Quarto da manhã.'], Difficulty.RECRUTA, 'Tradições', 'Pág 58'),

  // --- TÁTICA E COMBATE (PÁGS 127-226) ---
  createQuestion('ta1', 'No acrônimo OCOAV para estudo do terreno, a letra "O" refere-se a:', 'Observação e campos de tiro.', ['Ordens de combate e avanço.', 'Objetivo capturado e vigiado.', 'Orientação e coordenadas geográficas.'], Difficulty.COMBATENTE, 'Terreno', 'Pág 128'),
  createQuestion('ta2', 'Qual a principal diferença entre "COBERTA" e "ABRIGO"?', 'Coberta protege contra as vistas; Abrigo protege contra os fogos.', ['Não há diferença tática entre os termos.', 'Abrigo é apenas natural; Coberta é sempre artificial.', 'Coberta protege contra estilhaços; Abrigo apenas contra chuva.'], Difficulty.RECRUTA, 'Técnicas', 'Pág 141'),
  createQuestion('ta3', 'A fase do Assalto Anfíbio onde ocorrem os "Briefings" e testes do plano é o:', 'Ensaio.', ['Planejamento.', 'Embarque.', 'Travessia.'], Difficulty.COMBATENTE, 'OpAnf', 'Pág 168'),
  createQuestion('ta4', 'O lanço em marcha acelerada em terreno limpo não deve ser maior do que:', '15 metros.', ['5 metros.', '30 metros.', '50 metros.'], Difficulty.COMBATENTE, 'Técnicas', 'Pág 148'),

  // --- LIDERANÇA (PÁGS 76-84) ---
  createQuestion('l1', 'Qual o elemento fundamental que guia o exemplo do líder Fuzileiro Naval?', 'A Rosa das Virtudes.', ['O Regulamento Disciplinar.', 'A antiguidade no posto.', 'A Tabela de Lotação da OM.'], Difficulty.RECRUTA, 'Liderança', 'Pág 78'),
  createQuestion('l2', 'A liderança militar é baseada em quantos princípios fundamentais?', 'Onze princípios.', ['Cinco princípios.', 'Três princípios.', 'Sete princípios.'], Difficulty.ESPECIALISTA, 'Liderança', 'Pág 76'),
  createQuestion('l3', 'A variável "SITUAÇÃO" no processo de liderança refere-se a:', 'O ambiente, que pode variar de simples até elevado nível de estresse.', ['A quantidade de munição disponível no grupo.', 'O grau de amizade entre o líder e os liderados.', 'A data de promoção dos sargentos da unidade.'], Difficulty.COMBATENTE, 'Liderança', 'Pág 78'),
];

export const PRIZE_LEVELS = Array.from({ length: 1000 }, (_, i) => (i + 1) * 100);

export const RANKS = [
  'Ferro', 'Bronze', 'Prata', 'Ouro', 'Platina', 'Esmeralda', 'Diamante', 
  'Mestre', 'Grão-Mestre', 'Lenda', 'Imortal', 'Elite do CFN', 'Marechal do Cabão'
];
