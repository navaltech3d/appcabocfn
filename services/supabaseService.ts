
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

/**
 * Busca o ranking global.
 */
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
 * Usa o nickname como chave primária para resolver conflitos.
 */
export const upsertScore = async (nickname: string, score: number, rank: string, phone: string) => {
  if (!nickname || nickname === 'ADMIN' || !SUPABASE_KEY) return;

  const upperNick = nickname.trim().toUpperCase();

  try {
    // 1. Verificar pontuação atual para não reduzir o progresso do fuzileiro
    const checkResp = await fetch(`${SUPABASE_URL}/rest/v1/ranking?nickname=eq.${encodeURIComponent(upperNick)}&select=score`, {
      method: 'GET',
      headers: getHeaders(),
    });

    let finalScore = score;
    if (checkResp.ok) {
      const data = await checkResp.json();
      if (data && data.length > 0) {
        finalScore = Math.max(score, data[0].score);
      }
    }

    // 2. Realizar o POST com Prefer: resolution=merge-duplicates para fazer o UPSERT
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ranking`, {
      method: 'POST',
      headers: { 
        ...getHeaders(), 
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        nickname: upperNick,
        phone: phone.trim(),
        score: finalScore,
        rank: rank,
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      console.error('Falha na sincronização Supabase:', response.status, errorDetail);
    } else {
      console.log(`Sincronização bem-sucedida para ${upperNick}`);
    }
  } catch (error) {
    console.error('Erro de conexão com o banco de dados:', error);
  }
};
