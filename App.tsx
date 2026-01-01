
import React, { useState, useEffect } from 'react';
import { Question, Difficulty, User, RankingEntry, AppView } from './types';
import { INITIAL_QUESTIONS, PRIZE_LEVELS, RANKS } from './constants';
import { getSergeantHint, getMissionFeedback, getCaboVelhoOpinions } from './services/geminiService';

// --- Helper Functions ---

const getRankStyle = (rank: string) => {
  switch (rank) {
    case 'Grão-Mestre': return 'text-purple-400 border-purple-500 bg-purple-900/20 shadow-[0_0_15px_rgba(168,85,247,0.4)]';
    case 'Mestre': return 'text-red-400 border-red-500 bg-red-900/20';
    case 'Diamante': return 'text-cyan-300 border-cyan-400 bg-cyan-900/20 shadow-[0_0_10px_rgba(34,211,238,0.3)]';
    case 'Esmeralda': return 'text-emerald-400 border-emerald-500 bg-emerald-900/20';
    case 'Platina': return 'text-slate-300 border-slate-400 bg-slate-900/20';
    case 'Ouro': return 'text-accent-gold border-accent-gold bg-yellow-900/20';
    case 'Prata': return 'text-accent-silver border-accent-silver bg-gray-900/20';
    case 'Bronze': return 'text-accent-bronze border-accent-bronze bg-orange-900/20';
    default: return 'text-zinc-500 border-zinc-600 bg-zinc-900/20';
  }
};

const getRankIcon = (rank: string) => {
  switch (rank) {
    case 'Grão-Mestre': return 'crown';
    case 'Mestre': return 'military_tech';
    case 'Diamante': return 'diamond';
    case 'Esmeralda': return 'verified';
    case 'Platina': return 'shield';
    case 'Ouro': return 'star';
    case 'Prata': return 'workspace_premium';
    case 'Bronze': return 'medal';
    default: return 'person';
  }
};

const getAvatarUrl = (nickname: string, index: number) => {
    const seed = nickname.length + index;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
};

// --- Components ---

export default function App() {
  const [view, setView] = useState<AppView>('login');
  const [user, setUser] = useState<User | null>(null);
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [lifelines, setLifelines] = useState({ skip: 3, sergeant: 2, caboVelho: 1 });
  const [hint, setHint] = useState<string | null>(null);
  const [caboVelhoHint, setCaboVelhoHint] = useState<string | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [ranking, setRanking] = useState<RankingEntry[]>([]);

  useEffect(() => {
    const savedRanking = localStorage.getItem('cabao_ranking');
    if (savedRanking) setRanking(JSON.parse(savedRanking));

    const savedUser = localStorage.getItem('cabao_user');
    if (savedUser) {
        setUser(JSON.parse(savedUser));
        setView('menu');
    }
  }, []);

  const saveRanking = (entry: RankingEntry) => {
    let newRanking = [...ranking];
    const existingIndex = newRanking.findIndex(r => r.nickname.toUpperCase() === entry.nickname.toUpperCase());

    if (existingIndex !== -1) {
      newRanking[existingIndex].rank = entry.rank;
      if (entry.score > newRanking[existingIndex].score) {
        newRanking[existingIndex].score = entry.score;
      }
    } else {
      newRanking.push(entry);
    }

    newRanking = newRanking.sort((a, b) => {
        const rankIdxA = RANKS.indexOf(a.rank);
        const rankIdxB = RANKS.indexOf(b.rank);
        if (rankIdxB !== rankIdxA) return rankIdxB - rankIdxA;
        return b.score - a.score;
    }).slice(0, 10);

    setRanking(newRanking);
    localStorage.setItem('cabao_ranking', JSON.stringify(newRanking));
  };

  const handleLogin = (nickname: string, password?: string) => {
    if (!nickname.trim()) return;
    const upperNick = nickname.trim().toUpperCase();
    if (upperNick === 'ADMIN' && password?.toUpperCase() !== 'MARINHA') {
      alert("ACESSO NEGADO!");
      return;
    }

    const existingEntry = ranking.find(r => r.nickname.toUpperCase() === upperNick);
    const newUser: User = {
      nickname: upperNick,
      score: existingEntry?.score || 0,
      rank: existingEntry?.rank || 'Ferro',
      lastPlayed: Date.now(),
      isAdmin: upperNick === 'ADMIN'
    };
    setUser(newUser);
    localStorage.setItem('cabao_user', JSON.stringify(newUser));
    setView('menu');
  };

  const startGame = () => {
    // Ciclo de 100: Embaralha tudo e pega 100.
    // Rodada: Dessas 100, pega 16 para o Show do Milhão.
    const fullPool = [...questions].sort(() => Math.random() - 0.5).slice(0, 100);
    const roundPool = fullPool.sort(() => Math.random() - 0.5).slice(0, 16);
    
    setGameQuestions(roundPool);
    setCurrentQuestionIndex(0);
    setScore(0);
    setLifelines({ skip: 3, sergeant: 2, caboVelho: 1 });
    setHint(null);
    setCaboVelhoHint(null);
    setView('game');
  };

  const handleAnswer = (index: number) => {
    const q = gameQuestions[currentQuestionIndex];
    if (index === q.correctAnswer) {
      const nextIdx = currentQuestionIndex + 1;
      const pts = PRIZE_LEVELS[currentQuestionIndex];
      if (nextIdx >= gameQuestions.length) {
        finishGame(pts, true);
      } else {
        setScore(pts);
        setCurrentQuestionIndex(nextIdx);
        setHint(null);
        setCaboVelhoHint(null);
      }
    } else {
      finishGame(score, false);
    }
  };

  const finishGame = async (finalScore: number, won: boolean) => {
    setScore(finalScore);
    if (user) {
      let nextRank = user.rank;
      if (won) {
        const curIdx = RANKS.indexOf(user.rank);
        if (curIdx < RANKS.length - 1) nextRank = RANKS[curIdx + 1];
      }
      const updated = { ...user, score: Math.max(user.score, finalScore), rank: nextRank };
      setUser(updated);
      localStorage.setItem('cabao_user', JSON.stringify(updated));
      saveRanking({ nickname: user.nickname, score: finalScore, rank: nextRank });
    }
    const msg = await getMissionFeedback(finalScore, won);
    setFeedback(msg);
    setView('gameOver');
  };

  // --- Views ---

  const RankingView = () => {
    const top3 = ranking.slice(0, 3);
    const others = ranking.slice(3, 10);
    const userPos = ranking.findIndex(r => r.nickname === user?.nickname) + 1;

    return (
      <div className="flex-1 flex flex-col bg-background-dark min-h-screen animate-in fade-in duration-500">
        <header className="sticky top-0 z-50 bg-[#101922]/95 backdrop-blur-sm border-b border-[#28323c]">
            <div className="flex items-center p-4 justify-between">
                <button onClick={() => setView('menu')} className="text-white hover:bg-white/10 rounded-full p-2 transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="text-white text-lg font-bold flex-1 text-center pr-10 uppercase tracking-widest font-display">
                    Ranking de Batalha
                </h2>
            </div>
            <div className="px-4">
                <div className="flex border-b border-[#28323c] justify-between gap-2">
                    <button className="flex-1 pb-3 pt-2 text-[#9dabb9] text-xs font-bold uppercase">Semanal</button>
                    <button className="flex-1 pb-3 pt-2 text-[#9dabb9] text-xs font-bold uppercase">Mensal</button>
                    <button className="flex-1 pb-3 pt-2 border-b-[3px] border-primary text-primary text-sm font-extrabold uppercase">Geral</button>
                </div>
            </div>
        </header>

        <main className="flex-1 pb-32">
            <section className="relative pt-8 pb-10 px-4">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/10 blur-[60px] rounded-full pointer-events-none"></div>
                <div className="flex items-end justify-center gap-2 sm:gap-4 max-w-md mx-auto relative z-10">
                    {/* 2nd Place */}
                    {top3[1] && (
                        <div className="flex flex-col items-center w-1/3">
                            <div className="relative mb-2 group">
                                <div className="absolute -top-3 -right-2 bg-surface-dark border border-[#3b4754] rounded-full p-1 z-10 shadow-lg">
                                    <span className="material-symbols-outlined text-accent-silver text-[20px]">military_tech</span>
                                </div>
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-accent-silver bg-surface-dark overflow-hidden">
                                    <img src={getAvatarUrl(top3[1].nickname, 1)} alt="avatar" />
                                </div>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-accent-silver text-background-dark text-[10px] font-bold px-2 py-0.5 rounded-full">#2</div>
                            </div>
                            <p className="text-white text-xs font-bold truncate w-full text-center">{top3[1].nickname}</p>
                            <p className="text-[#9dabb9] text-[10px]">{top3[1].score} XP</p>
                            <div className="w-full h-16 bg-gradient-to-t from-surface-dark to-surface-dark/40 mt-3 rounded-t-lg border-t-4 border-accent-silver flex items-end justify-center pb-2">
                                <span className="text-accent-silver/20 font-black text-3xl">2</span>
                            </div>
                        </div>
                    )}
                    {/* 1st Place */}
                    {top3[0] && (
                        <div className="flex flex-col items-center w-1/3 -mb-4 z-20">
                            <div className="relative mb-3 animate-[bounce_3s_infinite]">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-accent-gold drop-shadow-lg">
                                    <span className="material-symbols-outlined text-[32px] fill-current">crown</span>
                                </div>
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-accent-gold bg-surface-dark overflow-hidden">
                                    <img src={getAvatarUrl(top3[0].nickname, 0)} alt="winner" />
                                </div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent-gold to-yellow-600 text-background-dark text-xs font-extrabold px-3 py-0.5 rounded-full border border-yellow-200 shadow-lg">#1</div>
                            </div>
                            <p className="text-white text-sm font-extrabold truncate w-full text-center text-shadow">{top3[0].nickname}</p>
                            <p className="text-accent-gold text-xs font-bold">{top3[0].score} XP</p>
                            <div className="w-full h-24 bg-gradient-to-t from-primary/30 to-primary/10 mt-3 rounded-t-lg border-t-4 border-accent-gold flex items-end justify-center pb-4 relative overflow-hidden">
                                <div className="absolute inset-0 bg-white/5 opacity-10"></div>
                                <span className="text-accent-gold/30 font-black text-5xl">1</span>
                            </div>
                        </div>
                    )}
                    {/* 3rd Place */}
                    {top3[2] && (
                        <div className="flex flex-col items-center w-1/3">
                            <div className="relative mb-2">
                                <div className="absolute -top-3 -right-2 bg-surface-dark border border-[#3b4754] rounded-full p-1 z-10 shadow-lg">
                                    <span className="material-symbols-outlined text-accent-bronze text-[20px]">military_tech</span>
                                </div>
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-accent-bronze bg-surface-dark overflow-hidden">
                                    <img src={getAvatarUrl(top3[2].nickname, 2)} alt="3rd" />
                                </div>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-accent-bronze text-white text-[10px] font-bold px-2 py-0.5 rounded-full">#3</div>
                            </div>
                            <p className="text-white text-xs font-bold truncate w-full text-center">{top3[2].nickname}</p>
                            <p className="text-[#9dabb9] text-[10px]">{top3[2].score} XP</p>
                            <div className="w-full h-12 bg-gradient-to-t from-surface-dark to-surface-dark/40 mt-3 rounded-t-lg border-t-4 border-accent-bronze flex items-end justify-center pb-2">
                                <span className="text-accent-bronze/20 font-black text-3xl">3</span>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <div className="px-5 pb-2 pt-2"><h3 className="text-white text-sm font-bold uppercase tracking-wider text-[#9dabb9]">Classificação Geral</h3></div>
            <div className="flex flex-col gap-3 px-4">
                {others.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-surface-dark p-3 pr-4 rounded-xl border border-[#28323c] shadow-sm">
                        <span className="text-[#9dabb9] font-bold text-sm w-6 text-center">{idx + 4}</span>
                        <div className="w-10 h-10 rounded-full bg-cover overflow-hidden border-2 border-[#3b4754]">
                            <img src={getAvatarUrl(entry.nickname, idx + 4)} alt="user" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-bold truncate text-sm uppercase">{entry.nickname}</p>
                            <p className="text-[#9dabb9] text-[10px] uppercase font-medium">{entry.rank}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-white font-bold text-sm">{entry.score} XP</p>
                        </div>
                    </div>
                ))}
                {ranking.length === 0 && <p className="text-center text-slate-500 py-10">Nenhum combatente registrado.</p>}
            </div>
        </main>

        <footer className="fixed bottom-0 left-0 w-full bg-surface-dark border-t border-primary/30 p-4 shadow-[0_-5px_20px_rgba(19,127,236,0.15)] z-40">
            <div className="flex items-center gap-4 max-w-2xl mx-auto">
                <div className="flex flex-col items-center justify-center">
                    <span className="text-primary text-[10px] font-bold uppercase tracking-wider">Sua Posição</span>
                    <span className="text-white font-black text-xl leading-none">{userPos || '--'}</span>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-primary overflow-hidden">
                    <img src={getAvatarUrl(user?.nickname || 'Eu', 99)} alt="me" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-white font-bold truncate text-sm">{user?.nickname} (Você)</p>
                        <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">{user?.rank}</span>
                    </div>
                    <div className="w-full bg-[#3b4754] h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${(RANKS.indexOf(user?.rank || 'Ferro') + 1) / RANKS.length * 100}%` }}></div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-white font-black text-base">{user?.score} XP</p>
                </div>
            </div>
        </footer>
      </div>
    );
  };

  // --- Views Auxiliares ---
  
  const LoginView = () => {
    const [name, setName] = useState('');
    const [pass, setPass] = useState('');
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in duration-500 military-gradient min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-emerald-600 flex items-center justify-center rounded-3xl border-4 border-white shadow-xl mx-auto">
            <span className="text-5xl">⚓</span>
          </div>
          <h2 className="text-4xl font-military text-white uppercase drop-shadow-lg">Identifique-se, Recruta!</h2>
        </div>
        <div className="w-full max-w-sm space-y-4">
          <input type="text" placeholder="NOME DE GUERRA" value={name} onChange={e => setName(e.target.value.toUpperCase())}
            className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-xl text-white font-bold text-center focus:border-primary outline-none transition-all uppercase" />
          {name.toUpperCase() === 'ADMIN' && (
            <input type="password" placeholder="SENHA" value={pass} onChange={e => setPass(e.target.value)}
              className="w-full bg-amber-900/20 border-2 border-amber-600/50 p-4 rounded-xl text-white text-center" />
          )}
          <button onClick={() => handleLogin(name, pass)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-military text-2xl py-4 rounded-xl border-b-4 border-emerald-800 transition-all uppercase">
            Entrar no Quartel
          </button>
        </div>
      </div>
    );
  };

  const MenuView = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 animate-in slide-in-from-bottom-10 duration-500 military-gradient min-h-screen">
        <h2 className="text-5xl font-military text-white uppercase tracking-wider">Centro de Operações</h2>
        <div className="grid grid-cols-1 gap-4 w-full max-w-md">
            <button onClick={startGame} className="bg-emerald-600 hover:bg-emerald-500 text-white p-6 rounded-2xl flex items-center justify-between border-b-4 border-emerald-800 shadow-xl group">
                <div className="text-left"><span className="block font-military text-3xl">Iniciar Missão</span><span className="text-emerald-200 text-xs uppercase">Acumule Mérito Militar</span></div>
                <span className="text-4xl group-hover:translate-x-2 transition-transform">🎯</span>
            </button>
            <button onClick={() => setView('ranking')} className="bg-slate-800 hover:bg-slate-700 text-white p-5 rounded-2xl flex items-center justify-between border-b-4 border-slate-900 transition-all">
                <div className="text-left"><span className="block font-bold">Quadro de Honra</span><span className="text-slate-400 text-xs uppercase">Elite dos Fuzileiros</span></div>
                <span className="text-2xl">🏆</span>
            </button>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-widest">Patente Atual</span>
                <span className={`text-2xl font-military uppercase ${getRankStyle(user?.rank || 'Ferro').split(' ')[0]}`}>{user?.rank}</span>
            </div>
        </div>
        <button onClick={() => { localStorage.removeItem('cabao_user'); setView('login'); }} className="text-slate-500 hover:text-red-400 text-xs uppercase font-bold mt-10">Dar Baixa (Logout)</button>
    </div>
  );

  const GameView = () => {
    const q = gameQuestions[currentQuestionIndex];
    if (!q) return null;
    return (
      <div className="flex-1 flex flex-col p-4 space-y-4 animate-in fade-in duration-300 military-gradient min-h-screen">
        <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-700">
            <div className="flex flex-col"><span className="text-[10px] text-slate-500 font-bold uppercase">Mérito Almejado</span><span className="text-xl font-military text-accent-gold">{PRIZE_LEVELS[currentQuestionIndex]} XP</span></div>
            <div className="flex flex-col items-end"><span className="text-[10px] text-slate-500 font-bold uppercase">Nível</span><span className="text-xs font-bold text-emerald-400 uppercase">{q.difficulty}</span></div>
        </div>
        <div className="flex-1 flex flex-col justify-center space-y-6 max-w-2xl mx-auto w-full">
            <div className="bg-slate-800 border-2 border-slate-600 p-8 rounded-3xl shadow-inner relative overflow-hidden">
                <h3 className="text-xl sm:text-2xl font-bold leading-tight text-white text-center relative z-10">{q.text}</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
                {q.options.map((opt, i) => (
                    <button key={i} onClick={() => handleAnswer(i)} className="flex items-center bg-slate-900 hover:bg-emerald-900/40 border-2 border-slate-700 hover:border-emerald-500 p-4 rounded-xl text-left transition-all active:scale-95 group">
                        <div className="w-10 h-10 flex items-center justify-center bg-slate-800 group-hover:bg-emerald-600 rounded-lg text-slate-400 group-hover:text-white font-bold mr-4">{String.fromCharCode(65 + i)}</div>
                        <span className="text-slate-200 font-medium">{opt}</span>
                    </button>
                ))}
            </div>
        </div>
        <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto w-full pb-4">
            <button onClick={() => { if(lifelines.skip > 0){ setLifelines(prev => ({...prev, skip: prev.skip-1})); setCurrentQuestionIndex(p => p+1); } }} className="bg-slate-800 p-3 rounded-xl border-b-4 border-slate-900 text-white font-bold text-[10px] uppercase">Recuar ({lifelines.skip})</button>
            <button onClick={async () => { if(lifelines.sergeant > 0){ setIsHintLoading(true); const h = await getSergeantHint(q); setHint(h); setLifelines(p => ({...p, sergeant: p.sergeant-1})); setIsHintLoading(false); } }} className="bg-amber-600 p-3 rounded-xl border-b-4 border-amber-800 text-white font-bold text-[10px] uppercase">Bizu SG ({lifelines.sergeant})</button>
            <button onClick={async () => { if(lifelines.caboVelho > 0){ setIsHintLoading(true); const h = await getCaboVelhoOpinions(q); setCaboVelhoHint(h); setLifelines(p => ({...p, caboVelho: 0})); setIsHintLoading(false); } }} className="bg-emerald-700 p-3 rounded-xl border-b-4 border-emerald-900 text-white font-bold text-[10px] uppercase">Cabo Velho ({lifelines.caboVelho})</button>
        </div>
        {hint && <div className="bg-amber-900/30 border border-amber-500/50 p-4 rounded-xl text-amber-200 text-sm italic">"{hint}"</div>}
        {caboVelhoHint && <div className="bg-emerald-900/30 border border-emerald-500/50 p-4 rounded-xl text-emerald-200 text-sm italic">{caboVelhoHint}</div>}
      </div>
    );
  };

  const GameOverView = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 animate-in zoom-in duration-500 military-gradient min-h-screen text-center">
        <h2 className="text-6xl font-military text-white uppercase">{score >= 1600 ? 'Missão Cumprida!' : 'Fim da Missão'}</h2>
        <div className="w-24 h-24 bg-emerald-600 flex items-center justify-center rounded-3xl border-4 border-white shadow-xl mx-auto"><span className="text-5xl">⚓</span></div>
        <p className="text-3xl font-military text-accent-gold uppercase">Mérito: {score} XP</p>
        <div className="max-w-md bg-slate-800/50 p-6 rounded-3xl border border-slate-700"><p className="text-white text-sm uppercase">{feedback}</p></div>
        <div className="flex gap-4 w-full max-w-sm">
            <button onClick={startGame} className="flex-1 bg-emerald-600 p-4 rounded-xl font-military text-xl border-b-4 border-emerald-800">Tentar Novamente</button>
            <button onClick={() => setView('menu')} className="flex-1 bg-slate-700 p-4 rounded-xl font-military text-xl border-b-4 border-slate-900">Menu</button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {view === 'login' && <LoginView />}
      {view === 'menu' && <MenuView />}
      {view === 'game' && <GameView />}
      {view === 'ranking' && <RankingView />}
      {view === 'gameOver' && <GameOverView />}
    </div>
  );
}
