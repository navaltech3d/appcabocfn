
// IMPORTANTE: A chave abaixo parece ser de outro serviço (ex: Stripe/Clerk).
// No Supabase, a 'anon key' é um JWT longo que começa com 'eyJ...'.
// Obtenha a correta em: Settings -> API -> anon public key
const SUPABASE_URL = 'https://fnshxeznhxlwoeblsrwe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2h4ZXpuaHhsd29lYmxzcndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODUwNDcsImV4cCI6MjA4MzI2MTA0N30.KunMhMna0Z3_OCqm4soBgHav-wYJOPI0LTWJcv4js_s'; 

const getHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
});

export const fetchGlobalRanking = async () => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ranking?select=*&order=score.desc&limit=10`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erro na API Supabase:', response.status, errorData);
      
      if (response.status === 401) throw new Error('Erro de Autenticação: Verifique sua SUPABASE_KEY');
      if (response.status === 404) throw new Error('Tabela "ranking" não encontrada no Supabase');
      throw new Error(`Erro ${response.status} ao conectar com o QG`);
    }

    return await response.json();
  } catch (error) {
    console.warn('Operando em modo local:', error);
    return []; // Retorna vazio para não quebrar a UI
  }
};

export const upsertScore = async (nickname: string, score: number, rank: string) => {
  if (!nickname || nickname === 'ADMIN') return;

  try {
    // 1. Verificar recorde atual (opcional, mas bom para evitar overwrite de scores menores)
    const checkResp = await fetch(`${SUPABASE_URL}/rest/v1/ranking?nickname=eq.${nickname}&select=score`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (checkResp.ok) {
      const currentData = await checkResp.json();
      if (currentData.length > 0 && currentData[0].score >= score) {
        return; // Recorde local não supera o global
      }
    }

    // 2. Upsert (Insert ou Update baseado na Primary Key 'nickname')
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ranking`, {
      method: 'POST',
      headers: { 
        ...getHeaders(), 
        'Prefer': 'resolution=merge-duplicates' 
      },
      body: JSON.stringify({
        nickname: nickname.toUpperCase(),
        score,
        rank,
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      console.error('Falha ao sincronizar score global:', response.status);
    }
  } catch (error) {
    console.error('Erro de rede ao salvar score global:', error);
  }
};
