
const SUPABASE_URL = 'https://ocoobqyxxhcpbuqoreay.supabase.co';
// Chave atualizada conforme fornecido pelo usuário
const SUPABASE_KEY = 'sb_publishable_C-U5yz_vricL-YqAfvv23g__rXAOInD'; 

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
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ranking_militar?select=nickname,phone,score,rank,updated_at&order=updated_at.desc`, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
        if (response.status === 401) {
            console.error("ERRO 401: A 'SUPABASE_KEY' é inválida. Verifique se a chave 'anon' está correta no painel do Supabase.");
        }
        const errText = await response.text();
        console.error("Erro na API:", errText);
        return [];
    }
    return await response.json();
  } catch (error) {
    console.error('Erro de conexão ao buscar inscritos:', error);
    return [];
  }
};

/**
 * Busca o ranking global.
 */
export const fetchGlobalRanking = async () => {
  if (!SUPABASE_KEY) return [];
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ranking_militar?select=nickname,score,rank&order=score.desc&limit=50`, {
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
 * Registra ou atualiza o score do fuzileiro no Supabase.
 */
export const upsertScore = async (nickname: string, score: number, rank: string, phone: string) => {
  if (!nickname || nickname === 'ADMIN' || !SUPABASE_KEY) return;

  const upperNick = nickname.trim().toUpperCase();

  try {
    // 1. Verificar score atual
    const checkResp = await fetch(`${SUPABASE_URL}/rest/v1/ranking_militar?nickname=eq.${encodeURIComponent(upperNick)}&select=score`, {
      method: 'GET',
      headers: getHeaders(),
    });

    let finalScore = score;
    if (checkResp.ok) {
      const data = await checkResp.json();
      if (data && data.length > 0) {
        finalScore = Math.max(score, data[0].score);
      }
    } else if (checkResp.status === 401) {
       console.error("ERRO 401 ao verificar score: Chave API Inválida.");
       return;
    }

    // 2. Realizar o UPSERT
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ranking_militar`, {
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
      const errorBody = await response.text();
      console.error(`Erro ao sincronizar (${response.status}):`, errorBody);
    } else {
      console.log(`Missão Sincronizada: ${upperNick}`);
    }
  } catch (error) {
    console.error('Erro de conexão com o banco de dados:', error);
  }
};
