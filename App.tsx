
import React, { useState, useEffect } from 'react';
import { Question, Difficulty, User, RankingEntry, AppView } from './types';
import { INITIAL_QUESTIONS, PRIZE_LEVELS, RANKS } from './constants';
import { getSergeantHint, getMissionFeedback, getCaboVelhoOpinions } from './services/geminiService';
import { fetchGlobalRanking, upsertScore } from './services/supabaseService';

const getRankStyle = (rank: string) => {
  switch (rank) {
    case 'Grão-Mestre': return 'text-purple-400 border-purple-500 bg-purple-900/20 shadow-[0_0_15px_rgba(168,85,247,0.4)]';
    case 'Mestre': return 'text-red-400 border-red-500 bg-red-900/20';
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
  const [score, setScore] = useState(0);
  const [lifelines, setLifelines] = useState({ skip: 3, sergeant: 2, caboVelho: 1 });
  const [hint, setHint] = useState<string | null>(null);
  const [caboVelhoHint, setCaboVelhoHint] = useState<string | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [wrongQuestionRef, setWrongQuestionRef] = useState<Question | null>(null);

  useEffect(() => {
    const sessionUser = localStorage.getItem('cabao_current_user');
    if (sessionUser) {
      setUser(JSON.parse(sessionUser));
      setView('menu');
    }
  }, []);

  const loadGlobalRanking = async () => {
    setIsRankingLoading(true);
    setRankingError(false);
    try {
      const data = await fetchGlobalRanking();
      if (data && data.length > 0) {
        setRanking(data);
      } else {
        // Fallback para ranking local se o global falhar ou estiver vazio
        const allUsers: User[] = JSON.parse(localStorage.getItem('cabao_all_users') || '[]');
        const localRanking = allUsers
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
          .map(u => ({ nickname: u.nickname, score: u.score, rank: u.rank }));
        setRanking(localRanking);
        if (allUsers.length === 0) setRankingError(true);
      }
    } catch (err) {
      setRankingError(true);
    } finally {
      setIsRankingLoading(false);
    }
  };

  const handleLogin = (nickname: string, password?: string) => {
    if (!nickname.trim()) return;
    const upperNick = nickname.trim().toUpperCase();
    
    if (upperNick === 'ADMIN' && password?.toUpperCase() !== 'MARINHA') {
      alert("SENHA DE COMANDO INCORRETA!");
      return;
    }

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

  const startGame = () => {
    if (!user) return;
    
    let seenIds = user.seenQuestionIds;
    if (seenIds.length >= 50) {
      seenIds = [];
      const updated = { ...user, seenQuestionIds: [] };
      updateUserPersist(updated);
    }

    let pool = INITIAL_QUESTIONS.filter(q => !seenIds.includes(q.id));
    if (pool.length < 16) pool = [...INITIAL_QUESTIONS];

    const selected = pool.sort(() => Math.random() - 0.5).slice(0, 16);
    setGameQuestions(selected);
    setCurrentQuestionIndex(0);
    setScore(0);
    setLifelines({ skip: 3, sergeant: 2, caboVelho: 1 });
    setHint(null);
    setCaboVelhoHint(null);
    setSelectedAnswer(null);
    setIsAnswerLocked(false);
    setView('game');
  };

  const updateUserPersist = async (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('cabao_current_user', JSON.stringify(updatedUser));
    const allUsers: User[] = JSON.parse(localStorage.getItem('cabao_all_users') || '[]');
    const idx = allUsers.findIndex(u => u.nickname === updatedUser.nickname);
    if (idx !== -1) {
      allUsers[idx] = updatedUser;
    } else {
      allUsers.push(updatedUser);
    }
    localStorage.setItem('cabao_all_users', JSON.stringify(allUsers));
    
    // Sincroniza com o Supabase de forma assíncrona (non-blocking)
    upsertScore(updatedUser.nickname, updatedUser.score, updatedUser.rank);
  };

  const handleAnswer = (index: number) => {
    if (isAnswerLocked || !user) return;
    const q = gameQuestions[currentQuestionIndex];
    setSelectedAnswer(index);
    setIsAnswerLocked(true);

    if (index === q.correctAnswer) {
      const updatedUser = { ...user, seenQuestionIds: [...user.seenQuestionIds, q.id] };
      updateUserPersist(updatedUser);

      setTimeout(() => {
        const nextIdx = currentQuestionIndex + 1;
        const currentXP = PRIZE_LEVELS[currentQuestionIndex];
        setScore(currentXP);

        if (nextIdx >= gameQuestions.length) {
          finishGame(currentXP, true);
        } else {
          setCurrentQuestionIndex(nextIdx);
          setHint(null);
          setCaboVelhoHint(null);
          setSelectedAnswer(null);
          setIsAnswerLocked(false);
        }
      }, 2000);
    } else {
      setWrongQuestionRef(q);
      const earnedXP = currentQuestionIndex > 0 ? PRIZE_LEVELS[currentQuestionIndex - 1] : 0;
      setScore(earnedXP);
      saveScore(earnedXP, false);
      setView('correction');
    }
  };

  const saveScore = async (finalScore: number, won: boolean) => {
    if (!user) return;
    let nextRank = user.rank;
    if (won) {
      const idx = RANKS.indexOf(user.rank);
      if (idx < RANKS.length - 1) nextRank = RANKS[idx + 1];
    }
    const updated = { ...user, score: Math.max(user.score, finalScore), rank: nextRank };
    await updateUserPersist(updated);
  };

  const finishGame = async (finalScore: number, won: boolean) => {
    await saveScore(finalScore, won);
    const msg = await getMissionFeedback(finalScore, won);
    setFeedback(msg);
    setView('gameOver');
  };

  const LoginView = () => {
    const [name, setName] = useState('');
    const [pass, setPass] = useState('');
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 military-gradient min-h-screen">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-emerald-600 flex items-center justify-center rounded-3xl border-4 border-white shadow-xl mx-auto mb-4">
            <span className="text-5xl">⚓</span>
          </div>
          <h2 className="text-4xl font-military text-white uppercase tracking-tighter">Alistar Combatente</h2>
        </div>
        <div className="w-full max-w-sm space-y-4">
          <input type="text" placeholder="NOME DE GUERRA" value={name} onChange={e => setName(e.target.value.toUpperCase())}
            className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-xl text-white font-bold text-center focus:border-primary outline-none uppercase" />
          {name === 'ADMIN' && (
            <input type="password" placeholder="SENHA DE COMANDO" value={pass} onChange={e => setPass(e.target.value)}
              className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-xl text-white font-bold text-center outline-none" />
          )}
          <button onClick={() => handleLogin(name, pass)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-military text-2xl py-4 rounded-xl border-b-4 border-emerald-800 transition-all uppercase">Apresentar</button>
        </div>
      </div>
    );
  };

  const RankingView = () => {
    const userPos = ranking.findIndex(u => u.nickname === user?.nickname) + 1;

    return (
      <div className="flex-1 flex flex-col bg-background-dark min-h-screen animate-in fade-in">
        <header className="sticky top-0 z-50 bg-[#101922]/95 backdrop-blur-sm border-b border-[#28323c]">
          <div className="flex items-center p-4">
            <button onClick={() => setView('menu')} className="text-white p-2 hover:bg-white/10 rounded-full transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h2 className="flex-1 text-center text-lg font-bold uppercase tracking-widest text-white pr-8">Quadro de Honra</h2>
          </div>
        </header>
        <main className="flex-1 pb-32 pt-4">
          {isRankingLoading ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-emerald-500 font-military text-xl uppercase animate-pulse">Sincronizando com QG...</p>
            </div>
          ) : rankingError ? (
            <div className="flex flex-col items-center justify-center p-10 text-center space-y-4">
               <span className="material-symbols-outlined text-red-500 text-6xl">cloud_off</span>
               <p className="text-white font-bold uppercase">Falha na Conexão Global</p>
               <p className="text-slate-400 text-xs">Exibindo apenas dados locais. Verifique as chaves do Supabase no código.</p>
               <button onClick={loadGlobalRanking} className="bg-slate-800 px-6 py-2 rounded-lg text-emerald-400 font-bold border border-emerald-500/30">Tentar Novamente</button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 px-4">
              {ranking.map((entry, i) => (
                <div key={i} className={`flex items-center gap-4 bg-surface-dark p-4 rounded-xl border ${entry.nickname === user?.nickname ? 'border-emerald-500 bg-emerald-900/10' : 'border-[#28323c]'}`}>
                  <span className={`font-black text-lg w-6 text-center ${i < 3 ? 'text-accent-gold' : 'text-[#9dabb9]'}`}>{i + 1}</span>
                  <div className="w-12 h-12 rounded-full border-2 border-[#3b4754] overflow-hidden bg-slate-800"><img src={getAvatarUrl(entry.nickname, i)} alt="" /></div>
                  <div className="flex-1 min-w-0"><p className="text-white font-bold text-md uppercase">{entry.nickname}</p><p className={`text-[10px] uppercase font-black ${getRankStyle(entry.rank)}`}>{entry.rank}</p></div>
                  <div className="text-right"><p className="text-accent-gold font-black text-lg">{entry.score}</p><p className="text-[8px] text-slate-500 uppercase font-bold">PONTOS XP</p></div>
                </div>
              ))}
            </div>
          )}
        </main>
        <footer className="fixed bottom-0 left-0 w-full bg-[#101922] border-t-2 border-emerald-500/50 p-4 z-40 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-4 max-w-2xl mx-auto">
            <div className="text-center bg-slate-800 px-3 py-1 rounded-lg border border-slate-700"><p className="text-emerald-400 text-[8px] font-bold uppercase">Sua Posição</p><p className="text-white font-black text-xl">{userPos || '--'}</p></div>
            <div className="flex-1"><p className="text-white font-black text-lg">{user?.nickname}</p><p className={`text-[10px] uppercase font-black ${getRankStyle(user?.rank || '')}`}>{user?.rank}</p></div>
            <div className="text-right bg-emerald-900/20 px-4 py-1 rounded-xl border border-emerald-500/30">
              <p className="text-white font-black text-xl">{user?.score} XP</p>
              <button onClick={loadGlobalRanking} className="text-[8px] text-emerald-400 font-bold uppercase hover:underline">Atualizar ↻</button>
            </div>
          </div>
        </footer>
      </div>
    );
  };

  const GameView = () => {
    const q = gameQuestions[currentQuestionIndex];
    if (!q) return null;
    return (
      <div className="flex-1 flex flex-col p-4 military-gradient min-h-screen">
        <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-700 mb-4 backdrop-blur-sm">
            <div><p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Acumulado</p><p className="text-xl font-military text-accent-gold">{score} XP</p></div>
            <div className="text-right"><p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Alvo Atual</p><p className="text-xl font-military text-emerald-400">{PRIZE_LEVELS[currentQuestionIndex]} XP</p></div>
        </div>
        <div className="flex-1 flex flex-col justify-center space-y-6 max-w-2xl mx-auto w-full">
            <div className="bg-slate-800/95 border-2 border-slate-600 p-8 rounded-3xl shadow-2xl relative text-center">
                <p className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{q.category}</p>
                <h3 className="text-xl sm:text-2xl font-bold leading-tight text-white mt-2">{q.text}</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
                {q.options.map((opt, i) => {
                    let btnClass = "bg-slate-900 border-slate-700 hover:border-primary/50";
                    if (selectedAnswer === i) {
                        btnClass = i === q.correctAnswer ? "bg-green-600 border-green-400 scale-[1.02] shadow-[0_0_20px_rgba(22,163,74,0.4)]" : "bg-red-600 border-red-400";
                    } else if (selectedAnswer !== null && i === q.correctAnswer) {
                        btnClass = "bg-green-600/40 border-green-400 animate-pulse";
                    }
                    return (
                        <button key={i} disabled={isAnswerLocked} onClick={() => handleAnswer(i)} className={`flex items-center border-2 p-4 rounded-xl text-left transition-all duration-300 ${btnClass}`}>
                            <div className="w-10 h-10 flex items-center justify-center bg-slate-800 rounded-lg text-slate-400 font-bold mr-4 shrink-0 shadow-inner">{String.fromCharCode(65 + i)}</div>
                            <span className="text-slate-200 font-medium">{opt}</span>
                        </button>
                    );
                })}
            </div>
        </div>
        <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto w-full pt-4">
            <button onClick={() => { if(lifelines.skip > 0 && !isAnswerLocked){ setLifelines(p => ({...p, skip: p.skip-1})); setCurrentQuestionIndex(prev => prev+1); } }} className="bg-slate-800 p-3 rounded-xl text-white font-bold text-[10px] uppercase border-b-4 border-black active:translate-y-1 transition-transform">Recuar ({lifelines.skip})</button>
            <button onClick={async () => { if(lifelines.sergeant > 0 && !isAnswerLocked){ setIsHintLoading(true); const h = await getSergeantHint(q); setHint(h); setLifelines(p => ({...p, sergeant: p.sergeant-1})); setIsHintLoading(false); } }} className="bg-amber-600 p-3 rounded-xl text-white font-bold text-[10px] uppercase border-b-4 border-amber-800 active:translate-y-1 transition-transform">Bizu SG ({lifelines.sergeant})</button>
            <button onClick={async () => { if(lifelines.caboVelho > 0 && !isAnswerLocked){ setIsHintLoading(true); const h = await getCaboVelhoOpinions(q); setCaboVelhoHint(h); setLifelines(p => ({...p, caboVelho: 0})); setIsHintLoading(false); } }} className="bg-emerald-700 p-3 rounded-xl text-white font-bold text-[10px] uppercase border-b-4 border-emerald-900 active:translate-y-1 transition-transform">Antigões ({lifelines.caboVelho})</button>
        </div>
        {isHintLoading && <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"><div className="bg-slate-800 p-6 rounded-2xl border-2 border-primary animate-pulse text-white font-military text-xl uppercase">Criptografando Bizu...</div></div>}
        {(hint || caboVelhoHint) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-slate-800 p-8 rounded-3xl border-2 border-primary max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in">
              <h4 className="text-2xl font-military text-primary uppercase">{hint ? 'Dica do Sargento' : 'Voz dos Antigões'}</h4>
              <p className="text-slate-200 italic leading-relaxed">"{hint || caboVelhoHint}"</p>
              <button onClick={() => { setHint(null); setCaboVelhoHint(null); }} className="w-full bg-primary p-3 rounded-xl font-bold uppercase shadow-lg">Entendido!</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const CorrectionView = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 military-gradient min-h-screen text-center animate-in zoom-in">
        <div className="bg-background-dark border-4 border-red-600 p-8 rounded-3xl shadow-2xl max-w-lg w-full space-y-6">
            <h2 className="text-4xl font-military text-red-500 uppercase tracking-tighter">Missão Abortada!</h2>
            <div className="text-left space-y-4">
                <p className="text-white font-bold text-lg italic leading-tight">"{wrongQuestionRef?.text}"</p>
                <div className="bg-green-900/30 border border-green-500 p-4 rounded-xl shadow-inner">
                    <p className="text-green-400 text-[10px] uppercase font-bold mb-1 tracking-widest text-center">Gabarito Verdadeiro:</p>
                    <p className="text-white font-black text-xl text-center">{wrongQuestionRef?.options[wrongQuestionRef.correctAnswer]}</p>
                </div>
                <div className="bg-slate-800 border border-slate-600 p-4 rounded-xl text-center">
                    <p className="text-slate-400 text-[10px] uppercase font-bold mb-1 tracking-widest">Fonte da Apostila:</p>
                    <p className="text-amber-400 font-black italic">{wrongQuestionRef?.reference}</p>
                </div>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                <p className="text-slate-500 text-[10px] font-bold uppercase">Mérito Acumulado Salvo:</p>
                <p className="text-2xl font-military text-accent-gold">{score} XP</p>
            </div>
            <button onClick={() => setView('menu')} className="w-full bg-slate-700 hover:bg-slate-600 p-4 rounded-xl font-military text-2xl text-white border-b-4 border-slate-950 transition-all uppercase shadow-lg">Retornar ao Quartel</button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background-dark text-white font-display">
      {view === 'login' && <LoginView />}
      {view === 'menu' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 military-gradient min-h-screen space-y-6 animate-in slide-in-from-bottom-10">
          <div className="text-center">
            <h1 className="text-7xl font-military text-white uppercase tracking-widest text-shadow mb-2">Show do Cabão</h1>
            <p className="text-emerald-400 font-bold text-xs uppercase tracking-[0.3em] bg-slate-900/40 py-1 px-4 rounded-full border border-emerald-500/20">Simulador Técnico - Apostila Invest</p>
          </div>
          <div className="w-full max-w-md space-y-4">
            <button onClick={startGame} className="w-full bg-emerald-600 hover:bg-emerald-500 p-6 rounded-2xl flex items-center justify-between border-b-4 border-emerald-800 shadow-xl group transition-all duration-300">
              <div className="text-left"><span className="block font-military text-3xl">Iniciar Treinamento</span><span className="text-emerald-200 text-xs uppercase font-bold">Objetivo: Promoção a Cabo</span></div>
              <span className="text-4xl group-hover:scale-125 group-hover:rotate-12 transition-transform">🎯</span>
            </button>
            <button onClick={() => { setView('ranking'); loadGlobalRanking(); }} className="w-full bg-slate-800 hover:bg-slate-700 p-5 rounded-2xl flex items-center justify-between border-b-4 border-slate-950 transition-all uppercase font-bold tracking-wider shadow-lg group">
              <div className="text-left"><span className="block">Quadro de Honra Global</span><span className="text-slate-400 text-[10px] uppercase">Recordes de Mérito</span></div>
              <span className="text-2xl group-hover:scale-110 transition-transform">🏆</span>
            </button>
            <div className="bg-slate-900/80 p-5 rounded-3xl border-2 border-slate-700 text-center shadow-2xl backdrop-blur-sm">
              <p className="text-slate-500 text-[10px] uppercase font-black mb-1 tracking-widest">Patente Atual</p>
              <p className={`text-4xl font-military uppercase drop-shadow-md tracking-wider ${getRankStyle(user?.rank || '')}`}>{user?.rank}</p>
              <div className="mt-4 flex flex-col items-center">
                <p className="text-accent-gold font-black text-2xl">{user?.score} XP</p>
                <p className="text-[8px] text-slate-500 uppercase font-black">Total Acumulado</p>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-[8px] uppercase font-black text-slate-400 mb-1 px-1 tracking-widest">
                  <span>Arsenal Visto:</span>
                  <span>{user?.seenQuestionIds.length} / 50</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                  <div className="bg-emerald-500 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${((user?.seenQuestionIds.length || 0) / 50) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          <button onClick={() => { localStorage.removeItem('cabao_current_user'); setView('login'); }} className="text-slate-500 hover:text-red-400 text-[10px] uppercase font-black tracking-widest underline transition-colors">Trocar Combatente</button>
        </div>
      )}
      {view === 'game' && <GameView />}
      {view === 'ranking' && <RankingView />}
      {view === 'gameOver' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 military-gradient min-h-screen text-center animate-in zoom-in">
          <h2 className="text-6xl font-military text-white uppercase mb-4 tracking-tighter">{score >= 1600 ? 'Promoção Garantida!' : 'Treino Concluído'}</h2>
          <div className="w-32 h-32 bg-emerald-600 flex items-center justify-center rounded-full border-8 border-white shadow-2xl mx-auto mb-4"><span className="text-7xl">⚓</span></div>
          <p className="text-4xl font-military text-accent-gold mb-6 uppercase tracking-wider">Mérito: {score} XP</p>
          <div className="max-w-md bg-slate-900/80 p-6 rounded-3xl border-2 border-slate-700 mb-8 shadow-inner"><p className="text-white text-sm uppercase italic font-black leading-relaxed">"{feedback}"</p></div>
          <div className="flex gap-4 w-full max-w-sm"><button onClick={startGame} className="flex-1 bg-emerald-600 hover:bg-emerald-500 p-4 rounded-xl font-military text-2xl border-b-4 border-emerald-800 uppercase shadow-lg transition-all active:scale-95">Reengajar</button><button onClick={() => setView('menu')} className="flex-1 bg-slate-700 hover:bg-slate-600 p-4 rounded-xl font-military text-2xl border-b-4 border-slate-900 uppercase shadow-lg transition-all active:scale-95">Quartel</button></div>
        </div>
      )}
      {view === 'correction' && <CorrectionView />}
    </div>
  );
}
