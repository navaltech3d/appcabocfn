
/**
 * IMPORTANTE: A chave abaixo (sb_publishable_...) não parece ser uma chave válida do Supabase.
 * Chaves do Supabase são JWTs longos que começam com 'eyJ...'.
 * Se o erro de rede persistir, verifique se a URL e a Anon Key estão corretas no painel do Supabase.
 */
const SUPABASE_URL = 'https://fnshxeznhxlwoeblsrwe.supabase.co';
const SUPABASE_KEY = 'sb_publishable_N-870wY6DMg8MSYoRQfrWw_Z3B1STZ-'; 

const getHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
});

export const fetchGlobalRanking = async () => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ranking?select=*&order=score.desc`, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erro na API Supabase:', response.status, errorData);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.warn('Erro ao carregar ranking global (Modo Local Ativo):', error);
    return [];
  }
};

export const upsertScore = async (nickname: string, score: number, rank: string) => {
  if (!nickname || nickname === 'ADMIN' || !SUPABASE_KEY.startsWith('eyJ')) {
    if (!SUPABASE_KEY.startsWith('eyJ')) {
      console.warn('Sincronização desativada: SUPABASE_KEY inválida (deve ser um JWT iniciando com eyJ)');
    }
    return;
  }

  try {
    // Primeiro verificamos se o score atual é maior que o do banco (opcional para economizar requisições)
    const checkResp = await fetch(`${SUPABASE_URL}/rest/v1/ranking?nickname=eq.${nickname.toUpperCase()}&select=score`, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors'
    });

    if (checkResp.ok) {
      const currentData = await checkResp.json();
      if (currentData.length > 0 && currentData[0].score >= score) {
        return; // Não precisa atualizar se o score no banco já for maior ou igual
      }
    }

    // Realiza o Upsert no Supabase usando o parâmetro on_conflict
    // Note: Para que isso funcione, 'nickname' deve ser a Primary Key ou ter restrição UNIQUE no banco.
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ranking?on_conflict=nickname`, {
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
      console.error('Erro ao sincronizar score:', response.status, err);
    }
  } catch (error) {
    // Captura erros de rede (DNS, CORS, Offline)
    console.error('Erro crítico de rede ao acessar Supabase. Verifique a URL e se há bloqueio de CORS:', error);
  }
};
