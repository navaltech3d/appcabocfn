
import { Question, Difficulty } from './types.ts';

const createQuestion = (
  id: string,
  text: string, 
  correct: string, 
  distractors: string[], 
  diff: Difficulty, 
  cat: string, 
  ref: string,
  bizu: string
): Question => {
  const options = [correct, ...distractors];
  // Embaralha as opções
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
    reference: ref,
    bizu
  };
};

export const INITIAL_QUESTIONS: Question[] = [
  // --- CERIMONIAL (Baseado na Q1 do Simulado) ---
  createQuestion('q1', 'De acordo com o Cerimonial da MB, assinale a alternativa CORRETA sobre o cerimonial de Bandeira:', 
    'O movimento de hasteamento ou arriamento da Bandeira é lento e contínuo de modo que o seu término coincida com o término do Hino ou toque.', 
    [
      'O oficial mais antigo a bordo de embarcação miúda pede licença para largar recebendo em troca a resposta "Está quem manda".',
      'Às 07h:55h, por ocasião do hasteamento, é içado o galhardete "Prep" na adriça de bombordo ou da direita.',
      'Em manobra de troca de mastro, a Bandeira Nacional é hasteada ou arriada sem cerimonial algum.',
      'Cadeia de comando é a sucessão de comandos vinculados em ordem decrescente e indireta.'
    ], 
    Difficulty.COMBATENTE, 'Cerimonial', 'Art. 2-2-4', 'Bizu: Sincronia total! O pano para de subir exatamente quando a música para.'),

  // --- HISTÓRICO CFN (Baseado na Q2 do Simulado) ---
  createQuestion('q2', 'Sobre o Histórico do CFN, analise a sequência correta de V ou F: (1) Entre 1847-1932 a artilharia evoluiu para GAC; (2) Em 1809 a Brigada Real ocupou a Fortaleza de São José; (3) A denominação "Corpo de Fuzileiros Navais" em 1932 iniciou a 3ª fase.', 
    'V - F - V', 
    [
      'V - V - V',
      'F - V - F',
      'V - F - F',
      'F - F - V'
    ], 
    Difficulty.ELITE, 'Histórico', 'Pág 53', 'Bizu: Cuidado com a data da Fortaleza de São José e o nome dos Ministros da época!'),

  // --- OGSA (Baseado na Q3 do Simulado - Questão de Exceto) ---
  createQuestion('q3', 'De acordo com a Ordenança Geral para o Serviço da Armada (OGSA), todas as afirmativas abaixo estão CORRETAS, EXCETO:', 
    'Todo Oficial ou Praça pode, em flagrante de crime inafiançável, prender à ordem de autoridade superior qualquer Oficial de antiguidade superior à sua.', 
    [
      'As OM de terra são estruturadas com base no Ato de Criação, Regulamento e Regimento Interno.',
      'Os Guardas-Marinha fazem parte da Oficialidade, com as restrições de Praças Especiais.',
      'Todos devem tratar-se mutuamente com urbanidade, e com atenção e justiça os subordinados.',
      'Aos Oficiais, Suboficiais e Primeiros-Sargentos é permitido entrar e sair à paisana das OM.'
    ], 
    Difficulty.ESPECIALISTA, 'OGSA', 'Art. 4-1-3', 'Bizu: Hierarquia é sagrada! Praça não prende Oficial de antiguidade superior sem ordem expressa específica.'),

  // --- ESTATUTO / LICENÇA (Baseado na Q4 do Simulado) ---
  createQuestion('q4', 'Qual é a definição correta para a autorização para afastamento total do serviço, em caráter temporário, concedida ao militar?', 
    'Licença', 
    [
      'Núpcias',
      'Férias',
      'Luto',
      'Dispensa'
    ], 
    Difficulty.RECRUTA, 'Estatuto', 'Art. 63', 'Bizu: Afastamento total e temporário é o conceito jurídico de Licença.'),

  // --- RDM (Baseado na Q5 do Simulado) ---
  createQuestion('q5', 'São circunstâncias ATENUANTES da contravenção disciplinar, EXCETO:', 
    'Ter sido cometida estando em risco a segurança da Organização Militar.', 
    [
      'Idade menor de 18 anos.',
      'Provocação.',
      'Bons antecedentes militares.',
      'Tempo de serviço militar menor de seis meses.'
    ], 
    Difficulty.COMBATENTE, 'RDM', 'Art. 10', 'Bizu: Estar em risco de segurança da OM é um AGRAVANTE, pois aumenta a gravidade do erro.'),

  // --- CONTINÊNCIA (Baseado na Q6 do Simulado) ---
  createQuestion('q6', 'Assinale a alternativa que NÃO cita corretamente uma situação em que a continência individual deve ser executada:', 
    'Sentado à mesa do rancho, em faina ou serviço que não possa ser interrompido.', 
    [
      'Fazendo parte de tropa armada.',
      'Em postos de continência.',
      'Integrando formatura comandada.',
      'Em postos de parada.'
    ], 
    Difficulty.COMBATENTE, 'Cerimonial', 'Art. 3-1-3', 'Bizu: No rancho ou na faina pesada, a segurança e a alimentação vêm antes do cumprimento.'),

  // --- PEQUENA GALA (Baseado na Q7 do Simulado) ---
  createQuestion('q7', 'Das datas festivas abaixo, marque a opção que NÃO corresponde a um dia de Pequena Gala na Marinha:', 
    'Natal - 25 de dezembro', 
    [
      'Dia do Trabalho - 1 de maio',
      'Batalha Naval do Riachuelo - 13 de junho',
      'Dia da Bandeira - 19 de novembro',
      'Dia de Tiradentes - 21 de abril'
    ], 
    Difficulty.ESPECIALISTA, 'Cerimonial', 'Art. 1-3-2', 'Bizu: Datas religiosas como Natal e Sexta-feira Santa possuem cerimonial diferenciado de gala.'),

  // --- VALORES MILITARES (Baseado na Q8 do Simulado) ---
  createQuestion('q8', 'São manifestações essenciais do valor militar, EXCETO:', 
    'O civismo e o culto das tradições históricas.', 
    [
      'O patriotismo, traduzido pela vontade inabalável de cumprir o dever militar.',
      'O espírito de corpo, orgulho do militar pela organização onde serve.',
      'O amor à profissão das armas e o entusiasmo com que é exercida.',
      'O culto aos Símbolos Nacionais.'
    ], 
    Difficulty.COMBATENTE, 'Estatuto', 'Art. 27', 'Bizu: Civismo é um preceito da ÉTICA militar, não uma manifestação do VALOR (são listas diferentes no Estatuto!).'),

  // --- DIREITOS (Baseado na Q9 do Simulado) ---
  createQuestion('q9', 'São direitos dos militares, conforme o Estatuto, EXCETO:', 
    'A demissão e o licenciamento voluntários a qualquer tempo sem indenização.', 
    [
      'A moradia para o militar em atividade (alojamento ou PNR).',
      'Uso de títulos, uniformes e distintivos correspondentes ao posto.',
      'A promoção.',
      'A transferência a pedido para a reserva remunerada.'
    ], 
    Difficulty.COMBATENTE, 'Estatuto', 'Art. 50', 'Bizu: Saída voluntária pode exigir indenização se a União investiu em cursos recentes.'),

  // --- DEVERES DAS PRAÇAS (Baseado na Q10 do Simulado) ---
  createQuestion('q10', 'Qual das alternativas abaixo NÃO descreve um dever específico das Praças da Marinha?', 
    'Participar dos exercícios de cultura física e desportos.', 
    [
      'Desempenhar qualquer atividade necessária à manutenção da ordem e segurança da OM.',
      'Desempenhar em serviço, no porto ou em viagem, as tarefas que lhe forem determinadas.',
      'Cumprir as instruções que tiverem para o serviço, fazendo com que sejam bem executadas pelos subordinados.',
      'Tomar parte nas mostras, fainas e exercícios, ocupando para isto o posto designado.'
    ], 
    Difficulty.COMBATENTE, 'OGSA', 'Art. 3-2-5', 'Bizu: Exercício físico é dever de TODO militar (Oficial e Praça), não é exclusivo das Praças.'),
];

export const PRIZE_LEVELS = Array.from({ length: 1000 }, (_, i) => (i + 1) * 100);

export const RANKS = [
  'Ferro', 'Bronze', 'Prata', 'Ouro', 'Platina', 'Esmeralda', 'Diamante', 
  'Mestre', 'Grão-Mestre', 'Lenda', 'Imortal', 'Elite do CFN', 'Marechal do Cabão'
];
