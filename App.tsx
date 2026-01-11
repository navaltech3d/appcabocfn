
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Question, User, RankingEntry, AppView } from './types.ts';
import { INITIAL_QUESTIONS, PRIZE_LEVELS, RANKS } from './constants.ts';
import { getSergeantHint, getMissionFeedback } from './services/geminiService.ts';
import { fetchGlobalRanking, upsertScore } from './services/supabaseService.ts';

const getRankStyle = (rank: string) => {
  switch (rank) {
    case 'Marechal do Cabão': return 'text-amber-400 border-amber-500 bg-amber-900/40 shadow-[0_0_20px_rgba(251,191,36,0.6)]';
    case 'Elite do CFN': return 'text-red-500 border-red-600 bg-red-900/30';
    case 'Grão-Mestre': return 'text-purple-400 border-purple-500 bg-purple-900/20 shadow-[0_0_15px_rgba(168,85,247,0.4)]';
    case 'Diamante': return 'text-cyan-300 border-cyan-400 bg-cyan-900/20 shadow-[0_0_10px_rgba(34,211,238,0.3)]';
    case 'Ouro': return 'text-accent-gold border-accent-gold';
    case 'Prata': return 'text-accent-silver border-accent-silver';
    case 'Bronze': return 'text-accent-bronze border-accent-bronze';
    default: return 'text-zinc-500 border-zinc-600';
  }
};

const getAvatarUrl = (nickname: string, index: number) => {
  const seed = nickname + index;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=1a242f`;
};

export default function App() {
  const [view, setView] = useState<AppView>('login');
  const [user, setUser] = useState<User | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [isRankingLoading, setIsRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState<boolean>(false);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [score, setScore] = useState(0);
  const [lifelines, setLifelines] = useState({ skip: 3, sergeant: 2, metaMeta: 1 });
  const [hint, setHint] = useState<string | null>(null);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [isPromoted, setIsPromoted] = useState<string | null>(null);
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [wrongQuestionRef, setWrongQuestionRef] = useState<Question | null>(null);

  // Ref para o timer do debounce
  const searchTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const sessionUser = localStorage.getItem('cabao_current_user');
      if (sessionUser) {
        const parsed = JSON.parse(sessionUser);
        setUser(parsed);
        setView('menu');
      }
    } catch (e) {
      console.error("Erro ao carregar sessão local:", e);
    }
  }, []);

  // Implementação do Debounce de 300ms para busca do ranking
  const loadGlobalRanking = useCallback(() => {
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    setIsRankingLoading(true);
    setRankingError(false);

    searchTimeoutRef.current = window.setTimeout(async () => {
      try {
        const data = await fetchGlobalRanking();
        if (data && data.length > 0) {
          setRanking(data);
        } else {
          const allUsers: User[] = JSON.parse(localStorage.getItem('cabao_all_users') || '[]');
          const localRanking = allUsers
            .sort((a, b) => b.score - a.score)
            .map(u => ({ nickname: u.nickname, score: u.score, rank: u.rank }));
          setRanking(localRanking);
          if (allUsers.length === 0) setRankingError(true);
        }
      } catch (err) {
        setRankingError(true);
      } finally {
        setIsRankingLoading(false);
      }
    }, 300);
  }, []);

  // Listener para redimensionamento com debounce (opcional, mas solicitado pelo contexto)
  useEffect(() => {
    const handleResize = () => {
      if (view === 'ranking') {
        loadGlobalRanking();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [view, loadGlobalRanking]);

  const handleLogin = (nickname: string, password?: string) => {
    if (!nickname.trim()) return;
    const upperNick = nickname.trim().toUpperCase();
    if (upperNick === 'ADMIN' && password?.toUpperCase() !== 'MARINHA') return alert("SENHA INCORRETA!");

    const allUsers: User[] = JSON.parse(localStorage.getItem('cabao_all_users') || '[]');
    let userData = allUsers.find(u => u.nickname === upperNick);

    if (!userData) {
      userData = { 
        nickname: upperNick, 
        score: 0, 
        rank: 'Ferro', 
        lastPlayed: Date.now(), 
        isAdmin: upperNick === 'ADMIN', 
        seenQuestionIds: [] 
      };
      allUsers.push(userData);
      localStorage.setItem('cabao_all_users', JSON.stringify(allUsers));
    }

    setUser(userData);
    localStorage.setItem('cabao_current_user', JSON.stringify(userData));
    setView('menu');
  };

  const generateQuestionPool = (seenIds: string[]) => {
    let pool = INITIAL_QUESTIONS.filter(q => !seenIds.includes(q.id));
    if (pool.length < 5) {
      pool = [...INITIAL_QUESTIONS].sort(() => Math.random() - 0.5);
    } else {
      pool = pool.sort(() => Math.random() - 0.5);
    }
    return pool;
  };

  const startGame = () => {
    if (!user) return;
    const pool = generateQuestionPool(user.seenQuestionIds);
    setGameQuestions(pool);
    setCurrentQuestionIndex(0);
    setConsecutiveCorrect(0);
    setScore(0);
    setLifelines({ skip: 3, sergeant: 2, metaMeta: 1 });
    setHint(null);
    setHiddenOptions([]);
    setSelectedAnswer(null);
    setIsAnswerLocked(false);
    setView('game');
  };

  const updateUserPersist = async (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('cabao_current_user', JSON.stringify(updatedUser));
    const allUsers: User[] = JSON.parse(localStorage.getItem('cabao_all_users') || '[]');
    const idx = allUsers.findIndex(u => u.nickname === updatedUser.nickname);
    if (idx !== -1) allUsers[idx] = updatedUser;
    else allUsers.push(updatedUser);
    localStorage.setItem('cabao_all_users', JSON.stringify(allUsers));
    
    upsertScore(updatedUser.nickname, updatedUser.score, updatedUser.rank).catch(err => {
      console.warn('Falha silenciosa na sincronização global:', err);
    });
  };

  const handleAnswer = (index: number) => {
    if (isAnswerLocked || !user) return;
    const q = gameQuestions[currentQuestionIndex];
    setSelectedAnswer(index);
    setIsAnswerLocked(true);

    if (index === q.correctAnswer) {
      const nextConsecutive = consecutiveCorrect + 1;
      setConsecutiveCorrect(nextConsecutive);
      
      const newSeen = Array.from(new Set([...user.seenQuestionIds, q.id]));
      const updatedUser = { ...user, seenQuestionIds: newSeen };
      
      if (nextConsecutive > 0 && nextConsecutive % 25 === 0) {
        const currentRankIdx = RANKS.indexOf(user.rank);
        const nextRank = RANKS[Math.min(currentRankIdx + 1, RANKS.length - 1)];
        updatedUser.rank = nextRank;
        setIsPromoted(nextRank);
      }

      updateUserPersist(updatedUser);

      setTimeout(() => {
        const nextIdx = currentQuestionIndex + 1;
        setScore(PRIZE_LEVELS[currentQuestionIndex]);
        
        if (nextIdx >= gameQuestions.length) {
          const nextPool = generateQuestionPool(updatedUser.seenQuestionIds);
          setGameQuestions(prev => [...prev, ...nextPool]);
        }
        
        setCurrentQuestionIndex(nextIdx);
        setHint(null);
        setHiddenOptions([]);
        setSelectedAnswer(null);
        setIsAnswerLocked(false);
        setIsPromoted(null);
      }, 2000);
    } else {
      setWrongQuestionRef(q);
      saveScore(score, false);
      setView('correction');
    }
  };

  const saveScore = async (finalScore: number, won: boolean) => {
    if (!user) return;
    const updated = { ...user, score: Math.max(user.score, finalScore) };
    await updateUserPersist(updated);
  };

  const useMetaMeta = () => {
    if (lifelines.metaMeta <= 0 || isAnswerLocked) return;
    const q = gameQuestions[currentQuestionIndex];
    const wrongIndices = q.options
      .map((_, i) => i)
      .filter(i => i !== q.correctAnswer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    setHiddenOptions(wrongIndices);
    setLifelines(p => ({ ...p, metaMeta: 0 }));
  };

  const RankingView = () => (
    <div className="flex-1 flex flex-col bg-background-dark min-h-screen">
      <header className="sticky top-0 z-50 bg-[#101922]/95 border-b border-[#28323c] p-4 flex items-center">
        <button onClick={() => setView('menu')} className="material-symbols-outlined text-white p-2">arrow_back</button>
        <h2 className="flex-1 text-center font-bold uppercase tracking-widest text-white">Quadro de Honra Global</h2>
        <button onClick={loadGlobalRanking} className="material-symbols-outlined text-emerald-400 p-2">refresh</button>
      </header>
      <main className="flex-1 p-4 pb-32">
        {isRankingLoading ? (
          <div className="flex flex-col items-center justify-center p-20 animate-pulse text-emerald-500 uppercase font-military">Sincronizando QG...</div>
        ) : rankingError ? (
          <div className="text-center p-10">
            <p className="text-red-400 font-bold uppercase mb-4">Erro de Conexão com o QG</p>
            <button onClick={loadGlobalRanking} className="bg-slate-800 px-6 py-2 rounded-lg text-emerald-400 border border-emerald-500/30 font-bold">Tentar Novamente</button>
          </div>
        ) : (
          <div className="space-y-3">
            {ranking.map((entry, i) => (
              <div key={i} className={`flex items-center gap-4 bg-surface-dark p-4 rounded-xl border ${entry.nickname === user?.nickname ? 'border-emerald-500' : 'border-[#28323c]'}`}>
                <span className="font-black text-lg w-6">{i + 1}</span>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800">
                  <img src={getAvatarUrl(entry.nickname, i)} alt="" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold uppercase text-sm">{entry.nickname}</p>
                  <p className={`text-[9px] uppercase font-black ${getRankStyle(entry.rank)}`}>{entry.rank}</p>
                </div>
                <div className="text-right font-military text-accent-gold">{entry.score} XP</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );

  const GameView = () => {
    const q = gameQuestions[currentQuestionIndex];
    if (!q) return null;
    return (
      <div className="flex-1 flex flex-col p-4 military-gradient min-h-screen">
        {isPromoted && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 animate-in zoom-in">
            <div className="text-center p-10 bg-slate-800 border-4 border-amber-500 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.5)]">
              <h2 className="text-5xl font-military text-amber-500 mb-4 animate-bounce uppercase">Promovido!</h2>
              <p className="text-white text-xl uppercase font-bold">Você agora é:</p>
              <p className={`text-4xl font-military mt-2 ${getRankStyle(isPromoted)}`}>{isPromoted}</p>
            </div>
          </div>
        )}
        <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-700 mb-4">
            <div><p className="text-[10px] uppercase font-bold text-slate-500">Acumulado</p><p className="text-xl font-military text-accent-gold">{score} XP</p></div>
            <div className="text-center"><p className="text-[10px] uppercase font-bold text-slate-500">Sequência</p><p className="text-xl font-military text-emerald-400">{consecutiveCorrect}</p></div>
            <div className="text-right"><p className="text-[10px] uppercase font-bold text-slate-500">Próximo</p><p className="text-xl font-military text-blue-400">{PRIZE_LEVELS[currentQuestionIndex]} XP</p></div>
        </div>
        <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full space-y-4">
            <div className="bg-slate-800 p-6 rounded-2xl border-2 border-slate-600 relative text-center shadow-2xl">
                <p className="text-[10px] font-black uppercase text-primary mb-2 tracking-widest">{q.category} - Q.{currentQuestionIndex + 1}</p>
                <h3 className="text-lg font-bold text-white leading-relaxed">{q.text}</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
                {q.options.map((opt, i) => {
                    const isHidden = hiddenOptions.includes(i);
                    let btnClass = isHidden ? "opacity-0 pointer-events-none" : "bg-slate-900 border-slate-700 hover:border-emerald-500/50";
                    if (selectedAnswer === i) btnClass = i === q.correctAnswer ? "bg-green-600 border-green-400" : "bg-red-600 border-red-400";
                    else if (selectedAnswer !== null && i === q.correctAnswer) btnClass = "bg-green-600/40 border-green-400 animate-pulse";
                    return (
                        <button key={i} disabled={isAnswerLocked || isHidden} onClick={() => handleAnswer(i)} className={`flex items-center border-2 p-3 rounded-xl text-left transition-all ${btnClass}`}>
                            <div className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded font-bold mr-3">{String.fromCharCode(65 + i)}</div>
                            <span className="text-sm">{opt}</span>
                        </button>
                    );
                })}
            </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 max-w-md mx-auto w-full">
            <button onClick={() => { if(lifelines.skip > 0 && !isAnswerLocked){ setLifelines(p => ({...p, skip: p.skip-1})); setCurrentQuestionIndex(p => p+1); } }} className="bg-slate-800 p-3 rounded-lg text-[10px] font-bold uppercase border-b-4 border-black">Recuar ({lifelines.skip})</button>
            <button onClick={async () => { if(lifelines.sergeant > 0 && !isAnswerLocked){ setIsHintLoading(true); const h = await getSergeantHint(q); setHint(h); setLifelines(p => ({...p, sergeant: p.sergeant-1})); setIsHintLoading(false); } }} className="bg-amber-600 p-3 rounded-lg text-[10px] font-bold uppercase border-b-4 border-amber-800">Bizu SG ({lifelines.sergeant})</button>
            <button onClick={useMetaMeta} className={`p-3 rounded-lg text-[10px] font-bold uppercase border-b-4 ${lifelines.metaMeta > 0 ? 'bg-emerald-700 border-emerald-900' : 'bg-slate-700 opacity-50'}`}>Meta-Meta ({lifelines.metaMeta})</button>
        </div>
        {isHintLoading && <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 text-white font-military text-xl uppercase animate-pulse">Criptografando Bizu...</div>}
        {hint && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
            <div className="bg-slate-800 p-8 rounded-2xl border-2 border-primary max-w-sm w-full text-center space-y-4 shadow-2xl">
              <h4 className="text-xl font-military text-primary uppercase">Dica do Sargento</h4>
              <p className="text-slate-200 italic">"{hint}"</p>
              <button onClick={() => setHint(null)} className="w-full bg-primary p-3 rounded-xl font-bold uppercase">AD SUMUS!</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const LoginView = () => {
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const handleStart = () => handleLogin(nickname, password);

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 military-gradient min-h-screen">
        <div className="w-full max-w-sm bg-slate-900/90 p-8 rounded-3xl border-2 border-slate-700 shadow-2xl space-y-6">
          <div className="text-center">
            <h2 className="text-4xl font-military text-white uppercase tracking-tighter">Apresente-se</h2>
            <p className="text-slate-400 text-[10px] uppercase font-bold mt-1">Identificação de Combatente</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 ml-1">Grito de Guerra (Nickname)</label>
              <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-xl text-white font-bold focus:border-emerald-500 outline-none transition-colors uppercase" placeholder="EX: RECRUTA_ZERO" />
            </div>
            {nickname.toUpperCase() === 'ADMIN' && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 ml-1">Código de Acesso</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                  className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-xl text-white font-bold focus:border-emerald-500 outline-none transition-colors" placeholder="********" />
              </div>
            )}
            <button onClick={handleStart} className="w-full bg-emerald-600 hover:bg-emerald-500 p-4 rounded-xl font-military text-2xl uppercase border-b-4 border-emerald-800 transition-all active:border-b-0 active:translate-y-1">Engajar</button>
          </div>
        </div>
      </div>
    );
  };

  const CorrectionView = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 military-gradient min-h-screen text-center">
        <div className="bg-background-dark border-4 border-red-600 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <h2 className="text-4xl font-military text-red-500 uppercase">Fogo Amigo!</h2>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <p className="text-white italic text-sm font-medium mb-3 leading-relaxed">"{wrongQuestionRef?.text}"</p>
              <div className="bg-green-900/30 p-4 rounded-xl border border-green-500">
                  <p className="text-green-400 text-[10px] uppercase font-black mb-1">Gabarito Correto:</p>
                  <p className="text-white font-bold text-lg">{wrongQuestionRef?.options[wrongQuestionRef.correctAnswer]}</p>
              </div>
            </div>
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">Referência: {wrongQuestionRef?.reference}</p>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Recorde de Sequência Nesta Missão:</p>
                <p className="text-3xl font-military text-emerald-400">{consecutiveCorrect}</p>
            </div>
            <button onClick={() => setView('menu')} className="w-full bg-slate-700 hover:bg-slate-600 p-5 rounded-xl font-military text-2xl uppercase border-b-4 border-slate-950 transition-all">Retornar ao Quartel</button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background-dark text-white font-display overflow-x-hidden select-none">
      {view === 'login' && <LoginView />}
      {view === 'menu' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 military-gradient space-y-6">
          <div className="text-center">
            <h1 className="text-7xl font-military text-white uppercase tracking-widest text-shadow">Show do Cabão</h1>
            <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest bg-slate-900/60 py-1 px-4 rounded-full inline-block mt-2">Simulador Técnico Militar 2026</p>
          </div>
          <div className="w-full max-w-md space-y-4">
            <button onClick={startGame} className="w-full bg-emerald-600 hover:bg-emerald-500 p-6 rounded-2xl flex items-center justify-between border-b-4 border-emerald-800 shadow-xl group transition-all">
              <div className="text-left">
                <span className="block font-military text-3xl">Operação Deserto</span>
                <span className="text-emerald-200 text-[10px] uppercase font-bold">Inicie sua Progressão</span>
              </div>
              <span className="text-4xl group-hover:rotate-12 transition-transform">🎯</span>
            </button>
            <button onClick={() => { setView('ranking'); loadGlobalRanking(); }} className="w-full bg-slate-800 hover:bg-slate-700 p-5 rounded-2xl flex items-center justify-between border-b-4 border-slate-950 group transition-all">
              <div className="text-left">
                <span className="block font-bold text-lg">Quadro de Honra</span>
                <span className="text-slate-400 text-[9px] uppercase">Elite do CFN</span>
              </div>
              <span className="text-2xl group-hover:scale-110 transition-transform">🏆</span>
            </button>
            <div className="bg-slate-900/80 p-6 rounded-3xl border-2 border-slate-700 text-center shadow-inner">
              <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-1">Sua Graduação Atual:</p>
              <p className={`text-5xl font-military uppercase leading-tight ${getRankStyle(user?.rank || '')}`}>{user?.rank}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="material-symbols-outlined text-accent-gold text-lg">military_tech</span>
                <p className="text-accent-gold font-black text-2xl">{user?.score} XP</p>
              </div>
            </div>
          </div>
          <button onClick={() => { localStorage.removeItem('cabao_current_user'); setView('login'); }} className="text-slate-500 text-[10px] uppercase font-black underline hover:text-white transition-colors">Trocar Combatente</button>
        </div>
      )}
      {view === 'game' && <GameView />}
      {view === 'ranking' && <RankingView />}
      {view === 'correction' && <CorrectionView />}
    </div>
  );
}
