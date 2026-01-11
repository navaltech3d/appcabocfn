
/**
 * IMPORTANTE: Sincronização automática com Supabase.
 * Certifique-se de que a tabela 'ranking' existe no seu banco Supabase
 * com as colunas: nickname (text, unique/pk), score (int8), rank (text), updated_at (timestamptz).
 */
const SUPABASE_URL = 'https://fnshxeznhxlwoeblsrwe.supabase.co';
const SUPABASE_KEY = 'sb_publishable_N-870wY6DMg8MSYoRQfrWw_Z3B1STZ-'; 

const getHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
});

export const fetchGlobalRanking = async () => {
  if (!SUPABASE_KEY) return [];
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ranking?select=*&order=score.desc&limit=50`, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors'
    });

    if (!response.ok) {
      console.error('Erro ao buscar ranking Supabase:', response.status);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.warn('Erro de rede ao carregar ranking global:', error);
    return [];
  }
};

export const upsertScore = async (nickname: string, score: number, rank: string) => {
  if (!nickname || nickname === 'ADMIN' || !SUPABASE_KEY) {
    return;
  }

  try {
    // Verificamos o score atual para evitar downgrade
    const checkResp = await fetch(`${SUPABASE_URL}/rest/v1/ranking?nickname=eq.${nickname.toUpperCase()}&select=score`, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors'
    });

    if (checkResp.ok) {
      const currentData = await checkResp.json();
      if (currentData.length > 0 && currentData[0].score >= score) {
        return; 
      }
    }

    // Upsert usando Prefer: resolution=merge-duplicates para lidar com conflitos de nickname
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ranking`, {
      method: 'POST',
      headers: { 
        ...getHeaders(), 
        'Prefer': 'resolution=merge-duplicates' 
      },
      mode: 'cors',
      body: JSON.stringify({
        nickname: nickname.toUpperCase(),
        score,
        rank,
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Falha no Sync Supabase:', response.status, err);
    }
  } catch (error) {
    console.error('Erro de conexão com Supabase:', error);
  }
};
