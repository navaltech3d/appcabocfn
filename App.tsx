
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Question, User, RankingEntry, AppView } from './types.ts';
import { INITIAL_QUESTIONS, PRIZE_LEVELS, RANKS } from './constants.ts';
import { getMissionFeedback } from './services/geminiService.ts';
import { fetchGlobalRanking, upsertScore, fetchQuestionsFromDB } from './services/supabaseService.ts';

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

export default function App() {
  const [view, setView] = useState<AppView>('login');
  const [user, setUser] = useState<User | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [isRankingLoading, setIsRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState<boolean>(false);
  
  // Pool unificado de questões (DB + Fallback)
  const [fullQuestionPool, setFullQuestionPool] = useState<Question[]>(INITIAL_QUESTIONS);
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

  const searchTimeoutRef = useRef<number | null>(null);

  // Carrega perguntas do banco ao iniciar
  useEffect(() => {
    const loadData = async () => {
      const dbQuestions = await fetchQuestionsFromDB();
      if (dbQuestions && dbQuestions.length > 0) {
        setFullQuestionPool([...INITIAL_QUESTIONS, ...dbQuestions]);
      }
      
      const sessionUser = localStorage.getItem('cabao_current_user');
      if (sessionUser) {
        setUser(JSON.parse(sessionUser));
        setView('menu');
      }
    };
    loadData();
  }, []);

  const loadGlobalRanking = useCallback(() => {
    setIsRankingLoading(true);
    fetchGlobalRanking().then(data => {
      setRanking(data);
      setIsRankingLoading(false);
    });
  }, []);

  const handleLogin = (nickname: string, phone: string, password?: string) => {
    if (!nickname.trim() || nickname.length < 3) return alert("Nickname muito curto!");
    if (!phone.trim() || phone.length < 10) return alert("Número de WhatsApp inválido!");
    
    const upperNick = nickname.trim().toUpperCase();
    if (upperNick === 'ADMIN' && password?.toUpperCase() !== 'MARINHA') return alert("ACESSO NEGADO!");

    const allUsers: User[] = JSON.parse(localStorage.getItem('cabao_all_users') || '[]');
    let userData = allUsers.find(u => u.nickname === upperNick);

    if (!userData) {
      userData = { 
        nickname: upperNick,
        phone: phone.trim(),
        score: 0, 
        rank: 'Ferro', 
        lastPlayed: Date.now(), 
        isAdmin: upperNick === 'ADMIN', 
        seenQuestionIds: [] 
      };
      allUsers.push(userData);
    } else {
      // Atualiza o telefone se o usuário já existe
      userData.phone = phone.trim();
    }

    localStorage.setItem('cabao_all_users', JSON.stringify(allUsers));
    setUser(userData);
    localStorage.setItem('cabao_current_user', JSON.stringify(userData));
    
    // Sincroniza com o banco imediatamente
    upsertScore(userData.nickname, userData.score, userData.rank, userData.phone);
    setView('menu');
  };

  const shuffleArray = (array: any[]) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const generateGameSession = (seenIds: string[]) => {
    let pool = fullQuestionPool.filter(q => !seenIds.includes(q.id));
    
    // Se esgotou TODAS as perguntas (do banco e locais), reinicia o ciclo
    if (pool.length === 0) {
      pool = [...fullQuestionPool];
      if (user) {
        const resetUser = { ...user, seenQuestionIds: [] };
        setUser(resetUser);
        localStorage.setItem('cabao_current_user', JSON.stringify(resetUser));
      }
    }

    return shuffleArray(pool);
  };

  const startGame = () => {
    if (!user) return;
    const session = generateGameSession(user.seenQuestionIds);
    setGameQuestions(session);
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
    
    upsertScore(updatedUser.nickname, updatedUser.score, updatedUser.rank, updatedUser.phone);
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
      
      if (nextConsecutive > 0 && nextConsecutive % 15 === 0) {
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
          // Se as perguntas da sessão acabaram, gera novas não vistas
          const moreQuestions = generateGameSession(newSeen);
          setGameQuestions(prev => [...prev, ...moreQuestions]);
        }
        
        setCurrentQuestionIndex(nextIdx);
        setHint(null);
        setHiddenOptions([]);
        setSelectedAnswer(null);
        setIsAnswerLocked(false);
        setIsPromoted(null);
      }, 1500);
    } else {
      setWrongQuestionRef(q);
      setView('correction');
    }
  };

  const LoginView = () => {
    const [nickname, setNickname] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 military-gradient min-h-screen">
        <div className="w-full max-w-sm bg-slate-900/95 p-8 rounded-3xl border-2 border-slate-700 shadow-2xl space-y-6">
          <div className="text-center">
            <h2 className="text-4xl font-military text-white uppercase tracking-tighter">Apresente-se</h2>
            <p className="text-emerald-400 text-[10px] uppercase font-bold mt-1 tracking-widest">Identificação de Combatente</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 ml-1">Grito de Guerra</label>
              <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} 
                className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-xl text-white font-bold focus:border-emerald-500 outline-none uppercase" placeholder="EX: RECRUTA_ZERO" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 ml-1">WhatsApp (DDD + Número)</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-xl text-white font-bold focus:border-emerald-500 outline-none" placeholder="21999999999" />
            </div>
            {nickname.toUpperCase() === 'ADMIN' && (
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-xl text-white font-bold" placeholder="Senha do QG" />
            )}
            <button onClick={() => handleLogin(nickname, phone, password)} className="w-full bg-emerald-600 hover:bg-emerald-500 p-4 rounded-xl font-military text-2xl uppercase border-b-4 border-emerald-800 transition-all active:translate-y-1 active:border-b-0">Engajar</button>
            <p className="text-[9px] text-center text-slate-500 uppercase font-bold px-4">Ao entrar, você autoriza o envio de atualizações táticas via WhatsApp.</p>
          </div>
        </div>
      </div>
    );
  };

  const MenuView = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 military-gradient space-y-8">
      <div className="text-center">
        <h1 className="text-7xl font-military text-white uppercase tracking-widest text-shadow">Show do Cabão</h1>
        <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest bg-slate-900/60 py-1 px-4 rounded-full inline-block mt-2">Plataforma de Treinamento 2026</p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <button onClick={startGame} className="w-full bg-emerald-600 hover:bg-emerald-500 p-6 rounded-2xl flex items-center justify-between border-b-4 border-emerald-800 shadow-xl group transition-all">
          <div className="text-left">
            <span className="block font-military text-4xl">Iniciar Missão</span>
            <span className="text-emerald-200 text-[10px] uppercase font-bold">Progresso Salvo no QG</span>
          </div>
          <span className="text-5xl group-hover:rotate-12 transition-transform">🎯</span>
        </button>

        <button onClick={() => { setView('ranking'); loadGlobalRanking(); }} className="w-full bg-slate-800 hover:bg-slate-700 p-5 rounded-2xl flex items-center justify-between border-b-4 border-slate-950 group transition-all">
          <div className="text-left">
            <span className="block font-bold text-lg">Quadro de Honra</span>
            <span className="text-slate-400 text-[9px] uppercase tracking-tighter">Ranking Mundial de Fuzileiros</span>
          </div>
          <span className="text-2xl group-hover:scale-110 transition-transform">🏆</span>
        </button>

        <div className="bg-slate-900/90 p-6 rounded-3xl border-2 border-slate-700 text-center shadow-inner relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
             <span className="material-symbols-outlined text-6xl">verified_user</span>
          </div>
          <p className="text-emerald-400 text-6xl font-military uppercase leading-none mb-4 truncate px-2">{user?.nickname}</p>
          <div className="flex flex-col items-center space-y-2">
            <p className="text-slate-500 text-[9px] uppercase font-black tracking-[0.2em]">Graduação de Combate</p>
            <p className={`text-xs font-black uppercase tracking-widest py-1.5 px-4 rounded-full border-2 ${getRankStyle(user?.rank || '')}`}>{user?.rank}</p>
          </div>
          <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-slate-800/50">
            <span className="material-symbols-outlined text-accent-gold">military_tech</span>
            <p className="text-accent-gold font-black text-2xl">{user?.score} XP ACUMULADOS</p>
          </div>
        </div>
      </div>

      <button onClick={() => { localStorage.removeItem('cabao_current_user'); setView('login'); }} className="text-slate-500 text-[10px] uppercase font-black underline hover:text-white transition-colors">Abandono de Posto (Sair)</button>
    </div>
  );

  const GameView = () => {
    const q = gameQuestions[currentQuestionIndex];
    if (!q) return null;
    return (
      <div className="flex-1 flex flex-col p-4 military-gradient min-h-screen">
        {isPromoted && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 animate-in zoom-in">
            <div className="text-center p-10 bg-slate-800 border-4 border-amber-500 rounded-3xl">
              <h2 className="text-5xl font-military text-amber-500 mb-4 animate-bounce">PROMOVIDO!</h2>
              <p className="text-white text-xl uppercase font-bold">Nova Graduação:</p>
              <p className={`text-4xl font-military mt-2 ${getRankStyle(isPromoted)}`}>{isPromoted}</p>
            </div>
          </div>
        )}
        <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-700 mb-4">
            <div><p className="text-[9px] uppercase font-bold text-slate-500">Saldo Atual</p><p className="text-lg font-military text-accent-gold">{score} XP</p></div>
            <div className="text-center"><p className="text-[9px] uppercase font-bold text-slate-500">Perguntas Vistas</p><p className="text-lg font-military text-white">{user?.seenQuestionIds.length} / {fullQuestionPool.length}</p></div>
            <div className="text-right"><p className="text-[9px] uppercase font-bold text-slate-500">Próximo Nível</p><p className="text-lg font-military text-blue-400">{PRIZE_LEVELS[currentQuestionIndex]} XP</p></div>
        </div>
        <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full space-y-4">
            <div className="bg-slate-800 p-6 rounded-2xl border-2 border-slate-600 text-center shadow-2xl">
                <p className="text-[10px] font-black uppercase text-emerald-500 mb-2 tracking-widest">{q.category}</p>
                <h3 className="text-lg font-bold text-white leading-relaxed">{q.text}</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
                {q.options.map((opt, i) => {
                    const isHidden = hiddenOptions.includes(i);
                    let btnClass = isHidden ? "opacity-0 pointer-events-none" : "bg-slate-900 border-slate-700";
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
            <button onClick={() => { if(lifelines.sergeant > 0 && !isAnswerLocked){ setHint(q.bizu); setLifelines(p => ({...p, sergeant: p.sergeant-1})); } }} className="bg-amber-600 p-3 rounded-lg text-[10px] font-bold uppercase border-b-4 border-amber-800">Bizu SG ({lifelines.sergeant})</button>
            <button onClick={() => { if(lifelines.metaMeta > 0 && !isAnswerLocked){
              const q = gameQuestions[currentQuestionIndex];
              const wrong = q.options.map((_, i) => i).filter(i => i !== q.correctAnswer).sort(() => Math.random() - 0.5).slice(0, 2);
              setHiddenOptions(wrong);
              setLifelines(p => ({ ...p, metaMeta: 0 }));
            }}} className={`p-3 rounded-lg text-[10px] font-bold uppercase border-b-4 ${lifelines.metaMeta > 0 ? 'bg-emerald-700 border-emerald-900' : 'bg-slate-700 opacity-50'}`}>Meta-Meta ({lifelines.metaMeta})</button>
        </div>
        {hint && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
            <div className="bg-slate-800 p-8 rounded-2xl border-2 border-emerald-500 max-w-sm w-full text-center space-y-4 shadow-2xl">
              <h4 className="text-xl font-military text-emerald-400">Dica do Sargento</h4>
              <p className="text-slate-200 italic">"{hint}"</p>
              <button onClick={() => setHint(null)} className="w-full bg-emerald-600 p-3 rounded-xl font-bold uppercase">ENTENDIDO!</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const CorrectionView = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 military-gradient min-h-screen text-center">
        <div className="bg-background-dark border-4 border-red-600 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <h2 className="text-4xl font-military text-red-500">FOGO AMIGO!</h2>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <p className="text-white italic text-sm mb-3">"{wrongQuestionRef?.text}"</p>
              <div className="bg-green-900/30 p-4 rounded-xl border border-green-500">
                  <p className="text-green-400 text-[9px] uppercase font-black mb-1">Gabarito:</p>
                  <p className="text-white font-bold text-lg">{wrongQuestionRef?.options[wrongQuestionRef.correctAnswer]}</p>
              </div>
            </div>
            <p className="text-amber-400 text-[10px] font-bold uppercase">Ref: {wrongQuestionRef?.reference}</p>
            <button onClick={() => setView('menu')} className="w-full bg-slate-700 hover:bg-slate-600 p-5 rounded-xl font-military text-2xl uppercase border-b-4 border-slate-950">Retornar ao Quartel</button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background-dark text-white font-display select-none">
      {view === 'login' && <LoginView />}
      {view === 'menu' && <MenuView />}
      {view === 'game' && <GameView />}
      {view === 'ranking' && (
        <div className="flex-1 flex flex-col bg-background-dark min-h-screen">
          <header className="sticky top-0 z-50 bg-[#101922]/95 border-b border-[#28323c] p-4 flex items-center">
            <button onClick={() => setView('menu')} className="material-symbols-outlined">arrow_back</button>
            <h2 className="flex-1 text-center font-bold uppercase text-white tracking-widest">Quadro de Honra</h2>
            <button onClick={loadGlobalRanking} className="material-symbols-outlined text-emerald-400">refresh</button>
          </header>
          <main className="flex-1 p-4">
            {isRankingLoading ? (
              <p className="text-center p-20 animate-pulse text-emerald-500 font-military uppercase">Escaneando Tropas...</p>
            ) : (
              <div className="space-y-3">
                {ranking.map((entry, i) => (
                  <div key={i} className={`flex items-center gap-4 bg-surface-dark p-4 rounded-xl border ${entry.nickname === user?.nickname ? 'border-emerald-500' : 'border-[#28323c]'}`}>
                    <span className="font-black text-lg w-6">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-white font-bold uppercase text-sm">{entry.nickname}</p>
                      <p className={`text-[9px] font-black uppercase tracking-widest ${getRankStyle(entry.rank)}`}>{entry.rank}</p>
                    </div>
                    <div className="text-right font-military text-accent-gold text-lg">{entry.score} XP</div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      )}
      {view === 'correction' && <CorrectionView />}
    </div>
  );
}
