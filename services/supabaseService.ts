
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

export const upsertScore = async (nickname: string, score: number, rank: string, phone: string) => {
  if (!nickname || nickname === 'ADMIN' || !SUPABASE_KEY) return;

  try {
    const checkResp = await fetch(`${SUPABASE_URL}/rest/v1/ranking?nickname=eq.${nickname.toUpperCase()}&select=score`, {
      method: 'GET',
      headers: getHeaders(),
    });

    let currentScore = -1;
    if (checkResp.ok) {
      const currentData = await checkResp.json();
      if (currentData.length > 0) currentScore = currentData[0].score;
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/ranking`, {
      method: 'POST',
      headers: { 
        ...getHeaders(), 
        'Prefer': 'resolution=merge-duplicates' 
      },
      body: JSON.stringify({
        nickname: nickname.toUpperCase(),
        phone: phone,
        score: Math.max(score, currentScore),
        rank,
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      console.error('Falha no Sync Supabase:', response.status);
    }
  } catch (error) {
    console.error('Erro de conexão com Supabase:', error);
  }
};
