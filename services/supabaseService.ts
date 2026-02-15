
const SUPABASE_URL = 'https://fnshxeznhxlwoeblsrwe.supabase.co';
const SUPABASE_KEY = 'sb_publishable_N-870wY6DMg8MSYoRQfrWw_Z3B1STZ-'; 

const getHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
});

/** 
 * Busca perguntas cadastradas no banco de dados.
 */
export const fetchQuestionsFromDB = async () => {
  if (!SUPABASE_KEY) return [];
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/questions?select=*`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.warn('Erro ao carregar perguntas do banco:', error);
    return [];
  }
};

/**
 * Busca todos os fuzileiros cadastrados para visualização admin.
 */
export const fetchAllSubscribers = async () => {
  if (!SUPABASE_KEY) return [];
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ranking?select=nickname,phone,score,rank,updated_at&order=updated_at.desc`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar inscritos:', error);
    return [];
  }
};

export const fetchGlobalRanking = async () => {
  if (!SUPABASE_KEY) return [];
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ranking?select=nickname,score,rank&order=score.desc&limit=50`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    return [];
  }
};

/**
 * Registra ou atualiza o score do usuário no Supabase.
 * Usa o nickname como chave de conflito para atualizar dados existentes.
 */
export const upsertScore = async (nickname: string, score: number, rank: string, phone: string) => {
  if (!nickname || nickname === 'ADMIN' || !SUPABASE_KEY) return;

  const upperNick = nickname.toUpperCase();

  try {
    // 1. Primeiro verificamos se o usuário já tem uma pontuação maior salva
    const checkResp = await fetch(`${SUPABASE_URL}/rest/v1/ranking?nickname=eq.${upperNick}&select=score`, {
      method: 'GET',
      headers: getHeaders(),
    });

    let finalScore = score;
    if (checkResp.ok) {
      const data = await checkResp.json();
      if (data.length > 0) {
        // Mantém sempre o maior score
        finalScore = Math.max(score, data[0].score);
      }
    }

    // 2. Realiza o Upsert (Insert ou Update caso o nickname já exista)
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ranking`, {
      method: 'POST',
      headers: { 
        ...getHeaders(), 
        'Prefer': 'resolution=merge-duplicates' // Instrução do Supabase para fazer Upsert baseado na PK
      },
      body: JSON.stringify({
        nickname: upperNick,
        phone: phone,
        score: finalScore,
        rank: rank,
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      console.error('Erro ao sincronizar com Supabase:', response.status, errorMsg);
    } else {
      console.log(`Dados sincronizados com sucesso para: ${upperNick}`);
    }
  } catch (error) {
    console.error('Erro de rede ao conectar com Supabase:', error);
  }
};
