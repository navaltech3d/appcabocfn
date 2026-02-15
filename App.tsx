
import React, { useState, useEffect, useCallback } from 'react';
import { Question, User, RankingEntry, AppView, Difficulty } from './types.ts';
import { INITIAL_QUESTIONS, PRIZE_LEVELS, RANKS } from './constants.ts';
import { fetchGlobalRanking, upsertScore, fetchQuestionsFromDB, fetchAllSubscribers } from './services/supabaseService.ts';

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
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [isRankingLoading, setIsRankingLoading] = useState(false);
  const [isSubscribersLoading, setIsSubscribersLoading] = useState(false);
  
  const [fullQuestionPool, setFullQuestionPool] = useState<Question[]>(INITIAL_QUESTIONS);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [score, setScore] = useState(0);
  const [lifelines, setLifelines] = useState({ skip: 3, sergeant: 2, metaMeta: 1 });
  const [hint, setHint] = useState<string | null>(null);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [isPromoted, setIsPromoted] = useState<string | null>(null);
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [wrongQuestionRef, setWrongQuestionRef] = useState<Question | null>(null);

  // Estado para controlar o pop-up de aviso do WhatsApp
  const [showLoginNotice, setShowLoginNotice] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      const dbQuestions = await fetchQuestionsFromDB();
      if (dbQuestions && dbQuestions.length > 0) {
        const merged = [...INITIAL_QUESTIONS];
        dbQuestions.forEach((dq: any) => {
          if (!merged.find(m => m.text === dq.text)) merged.push(dq);
        });
        setFullQuestionPool(merged);
      }
      
      const sessionUser = localStorage.getItem('cabao_current_user');
      if (sessionUser) {
        const u = JSON.parse(sessionUser);
        setUser(u);
        setView(u.isAdmin ? 'admin' : 'menu');
        if (u.isAdmin) loadAdminData();
      }
    };
    loadInitialData();
  }, []);

  const loadGlobalRanking = useCallback(() => {
    setIsRankingLoading(true);
    fetchGlobalRanking().then(data => {
      setRanking(data);
      setIsRankingLoading(false);
    });
  }, []);

  const loadAdminData = useCallback(() => {
    setIsSubscribersLoading(true);
    fetchAllSubscribers().then(data => {
      setSubscribers(data);
      setIsSubscribersLoading(false);
    });
  }, []);

  const handleLogin = (nickname: string, phone: string, password?: string) => {
    const upperNick = nickname.trim().toUpperCase();
    
    if (upperNick === 'ADMIN') {
      if (password?.toUpperCase() === 'MARINHA') {
        const adminUser = { 
          nickname: 'ADMIN', phone: '000', score: 0, rank: 'COMANDO', 
          lastPlayed: Date.now(), isAdmin: true, seenQuestionIds: [] 
        };
        setUser(adminUser);
        localStorage.setItem('cabao_current_user', JSON.stringify(adminUser));
        setView('admin');
        loadAdminData();
        return;
      } else {
        return alert("ACESSO NEGADO: CÓDIGO INCORRETO!");
      }
    }

    if (!nickname.trim() || nickname.length < 3) return alert("Grito de Guerra muito curto!");
    if (!phone.trim() || phone.length < 10) return alert("Número de WhatsApp inválido!");

    const allUsers: User[] = JSON.parse(localStorage.getItem('cabao_all_users') || '[]');
    let userData = allUsers.find(u => u.nickname === upperNick);

    if (!userData) {
      userData = { 
        nickname: upperNick, phone: phone.trim(), score: 0, 
        rank: 'Ferro', lastPlayed: Date.now(), isAdmin: false, seenQuestionIds: [] 
      };
      allUsers.push(userData);
    } else {
      userData.phone = phone.trim();
    }

    localStorage.setItem('cabao_all_users', JSON.stringify(allUsers));
    setUser(userData);
    localStorage.setItem('cabao_current_user', JSON.stringify(userData));
    upsertScore(userData.nickname, userData.score, userData.rank, userData.phone);
    setView('menu');
  };

  const startGame = () => {
    if (!user) return;
    let pool = fullQuestionPool.filter(q => !user.seenQuestionIds.includes(q.id));
    
    if (pool.length === 0) {
      pool = [...fullQuestionPool];
      const resetUser = { ...user, seenQuestionIds: [] };
      setUser(resetUser);
      localStorage.setItem('cabao_current_user', JSON.stringify(resetUser));
    }
    
    const session = [...pool].sort(() => Math.random() - 0.5);
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

  const AdminView = () => (
    <div className="flex-1 flex flex-col bg-background-dark min-h-screen">
      <header className="sticky top-0 z-50 bg-slate-900 border-b border-emerald-500/30 p-4 flex items-center justify-between shadow-lg">
        <h2 className="font-military text-2xl text-emerald-400">PAINEL DE COMANDO</h2>
        <button onClick={() => { localStorage.removeItem('cabao_current_user'); setView('login'); }} className="text-[10px] font-black uppercase text-red-500 border border-red-500 px-3 py-1 rounded">Deslogar</button>
      </header>
      <main className="flex-1 p-4 space-y-6 overflow-y-auto pb-20">
        <section className="bg-slate-900/50 p-6 rounded-3xl border border-slate-700 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h3 className="text-emerald-500 font-bold uppercase text-xs tracking-widest">Fuzileiros Registrados ({subscribers.length})</h3>
            <button onClick={loadAdminData} className="material-symbols-outlined text-sm text-slate-500">refresh</button>
          </div>
          {isSubscribersLoading ? (
            <p className="text-center p-10 animate-pulse text-emerald-500 text-xs">Acessando comunicações...</p>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
              {subscribers.map((sub, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                  <div>
                    <p className="text-white font-bold text-xs">{sub.nickname}</p>
                    <p className="text-emerald-400 font-mono text-[10px] tracking-widest">{sub.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-accent-gold font-military text-sm">{sub.score} XP</p>
                    <p className="text-[8px] uppercase text-slate-500 font-black">{sub.rank}</p>
                  </div>
                </div>
              ))}
              {subscribers.length === 0 && <p className="text-center text-slate-500 text-xs py-10 uppercase font-bold">Nenhum fuzileiro detectado.</p>}
            </div>
          )}
        </section>
      </main>
    </div>
  );

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
        updatedUser.rank = RANKS[Math.min(currentRankIdx + 1, RANKS.length - 1)];
        setIsPromoted(updatedUser.rank);
      }
      
      setUser(updatedUser);
      localStorage.setItem('cabao_current_user', JSON.stringify(updatedUser));
      upsertScore(updatedUser.nickname, Math.max(user.score, score + 100), updatedUser.rank, updatedUser.phone);

      setTimeout(() => {
        const nextIdx = currentQuestionIndex + 1;
        setScore(PRIZE_LEVELS[currentQuestionIndex]);
        
        if (nextIdx >= gameQuestions.length) {
          const more = fullQuestionPool.filter(qu => !newSeen.includes(qu.id)).sort(() => Math.random() - 0.5);
          setGameQuestions(prev => [...prev, ...more]);
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
    const [isAdminField, setIsAdminField] = useState(false);

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 military-gradient min-h-screen relative overflow-hidden">
        {/* Pop-up de Aviso do WhatsApp */}
        {showLoginNotice && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-slate-900 border-2 border-emerald-500 rounded-3xl p-8 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-in zoom-in-95 duration-300">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-emerald-500 animate-pulse">
                  <span className="material-symbols-outlined text-4xl text-emerald-500">campaign</span>
                </div>
              </div>
              <h3 className="text-2xl font-military text-white text-center mb-4 uppercase tracking-tighter">COMUNICADO IMPORTANTE</h3>
              <p className="text-slate-300 text-sm text-center leading-relaxed mb-8">
                Fuzileiro, certifique-se de inserir seu <span className="text-emerald-400 font-bold">WhatsApp corretamente</span>. 
                <br /><br />
                Através dele, você receberá <span className="text-white font-bold">GRATUITAMENTE</span> informações sobre atualizações de bizus, novas questões e novidades cruciais para sua aprovação!
                <br /><br />
                <span className="text-[10px] uppercase text-emerald-500/80 font-black tracking-widest">
                  Apenas o administrador do sistema terá acesso a essa informação.
                </span>
              </p>
              <button 
                onClick={() => setShowLoginNotice(false)} 
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-military text-xl py-4 rounded-2xl border-b-4 border-emerald-800 transition-all active:translate-y-1 active:border-b-0"
              >
                COMPREENDIDO, COMANDO!
              </button>
            </div>
          </div>
        )}

        <div className="w-full max-w-sm bg-slate-900/95 p-8 rounded-3xl border-2 border-slate-700 shadow-2xl space-y-6">
          <div className="text-center">
            <h2 className="text-4xl font-military text-white uppercase tracking-tighter">Apresente-se</h2>
            <p className="text-emerald-400 text-[10px] uppercase font-bold mt-1 tracking-widest">Identificação de Combatente</p>
          </div>
          <div className="space-y-4">
            <input type="text" placeholder="Grito de Guerra" className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-xl text-white font-bold outline-none focus:border-emerald-500 uppercase" 
              value={nickname} onChange={(e) => { setNickname(e.target.value); if(e.target.value.toUpperCase()==='ADMIN') setIsAdminField(true); else setIsAdminField(false); }} />
            <div className="relative">
              <input type="tel" placeholder="WhatsApp (DDD + Número)" className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-xl text-white font-bold outline-none focus:border-emerald-500" 
                value={phone} onChange={(e) => setPhone(e.target.value)} />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-sm">chat_bubble</span>
            </div>
            {isAdminField && (
              <input type="password" placeholder="Código de Comando" className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-xl text-white font-bold animate-in slide-in-from-top-2" 
                value={password} onChange={(e) => setPassword(e.target.value)} />
            )}
            <button onClick={() => handleLogin(nickname, phone, password)} className="w-full bg-emerald-600 p-4 rounded-xl font-military text-2xl uppercase border-b-4 border-emerald-800 active:translate-y-1 active:border-b-0">Engajar</button>
            <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 animate-pulse">Última Atualização: 15/02/2026</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-dark text-white font-display select-none">
      {view === 'login' && <LoginView />}
      {view === 'admin' && <AdminView />}
      {view === 'menu' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 military-gradient space-y-8 text-center overflow-y-auto">
          <h1 className="text-7xl font-military text-white uppercase tracking-widest text-shadow mt-4">Show do Cabão</h1>
          <div className="w-full max-w-md space-y-4 px-4">
            <button onClick={startGame} className="w-full bg-emerald-600 p-6 rounded-2xl flex items-center justify-between border-b-4 border-emerald-800 group shadow-xl">
              <div className="text-left"><span className="block font-military text-4xl">Iniciar Missão</span><span className="text-emerald-200 text-[10px] uppercase font-bold">Treinamento Intensivo</span></div>
              <span className="text-5xl group-hover:rotate-12 transition-transform">🎯</span>
            </button>
            <button onClick={() => { setView('ranking'); loadGlobalRanking(); }} className="w-full bg-slate-800 p-5 rounded-2xl flex items-center justify-between border-b-4 border-slate-950 group">
              <div className="text-left"><span className="block font-bold text-lg">Quadro de Honra</span><span className="text-slate-400 text-[9px] uppercase">Ranking Global</span></div>
              <span className="text-2xl group-hover:scale-110 transition-transform">🏆</span>
            </button>
            <div className="bg-slate-900/90 p-6 rounded-3xl border-2 border-slate-700 shadow-inner relative overflow-hidden">
              <p className="text-emerald-400 text-6xl font-military uppercase leading-none mb-4 truncate px-2">{user?.nickname}</p>
              <p className={`text-xs font-black uppercase tracking-widest py-1.5 px-4 rounded-full border-2 inline-block ${getRankStyle(user?.rank || '')}`}>{user?.rank}</p>
              <div className="mt-5 pt-4 border-t border-slate-800/50 flex justify-center gap-2">
                <span className="material-symbols-outlined text-accent-gold">military_tech</span>
                <p className="text-accent-gold font-black text-2xl">{user?.score} XP</p>
              </div>
            </div>
          </div>
          <button onClick={() => { localStorage.removeItem('cabao_current_user'); setView('login'); }} className="text-slate-500 text-[10px] uppercase font-black underline hover:text-white pb-6">Sair</button>
        </div>
      )}

      {view === 'game' && (
        <div className="flex-1 flex flex-col p-4 military-gradient min-h-screen overflow-y-auto">
          {isPromoted && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 animate-in zoom-in">
              <div className="text-center p-10 bg-slate-800 border-4 border-amber-500 rounded-3xl">
                <h2 className="text-5xl font-military text-amber-500 mb-4 animate-bounce">PROMOVIDO!</h2>
                <p className={`text-4xl font-military mt-2 ${getRankStyle(isPromoted)}`}>{isPromoted}</p>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-700 mb-4 max-w-2xl mx-auto w-full">
            <div><p className="text-[9px] uppercase font-bold text-slate-500">XP</p><p className="text-lg font-military text-accent-gold">{score}</p></div>
            <div className="text-center"><p className="text-[9px] uppercase font-bold text-slate-500">Inteligência</p><p className="text-lg font-military text-white">{user?.seenQuestionIds.length} / {fullQuestionPool.length}</p></div>
            <div className="text-right"><p className="text-[9px] uppercase font-bold text-slate-500">Alvo</p><p className="text-lg font-military text-blue-400">{PRIZE_LEVELS[currentQuestionIndex]}</p></div>
          </div>
          <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full space-y-4">
            <div className="bg-slate-800 p-6 rounded-2xl border-2 border-slate-600 text-center shadow-2xl">
              <p className="text-[10px] font-black uppercase text-emerald-400 mb-2 tracking-widest">{gameQuestions[currentQuestionIndex]?.category}</p>
              <h3 className="text-lg font-bold text-white leading-relaxed">{gameQuestions[currentQuestionIndex]?.text}</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {gameQuestions[currentQuestionIndex]?.options.map((opt, i) => {
                const isHidden = hiddenOptions.includes(i);
                let btnClass = isHidden ? "opacity-0 pointer-events-none" : "bg-slate-900 border-slate-700";
                if (selectedAnswer === i) btnClass = i === gameQuestions[currentQuestionIndex].correctAnswer ? "bg-green-600 border-green-400" : "bg-red-600 border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.5)]";
                else if (selectedAnswer !== null && i === gameQuestions[currentQuestionIndex].correctAnswer) btnClass = "bg-green-600/40 border-green-400 animate-pulse";
                return (
                  <button key={i} disabled={isAnswerLocked || isHidden} onClick={() => handleAnswer(i)} className={`flex items-center border-2 p-3 rounded-xl text-left transition-all hover:border-emerald-500/50 ${btnClass}`}>
                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-slate-800 rounded font-bold mr-3">{String.fromCharCode(65 + i)}</div>
                    <span className="text-sm font-medium">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 max-w-md mx-auto w-full">
            <button onClick={() => { if(lifelines.skip > 0 && !isAnswerLocked){ setLifelines(p => ({...p, skip: p.skip-1})); setCurrentQuestionIndex(p => p+1); } }} className="bg-slate-800 p-3 rounded-lg text-[10px] font-bold uppercase border-b-4 border-black">Pular ({lifelines.skip})</button>
            <button onClick={() => { if(lifelines.sergeant > 0 && !isAnswerLocked){ setHint(gameQuestions[currentQuestionIndex].bizu); setLifelines(p => ({...p, sergeant: p.sergeant-1})); } }} className="bg-amber-600 p-3 rounded-lg text-[10px] font-bold uppercase border-b-4 border-amber-800">Bizu SG ({lifelines.sergeant})</button>
            <button onClick={() => { if(lifelines.metaMeta > 0 && !isAnswerLocked){
              const q = gameQuestions[currentQuestionIndex];
              const wrong = q.options.map((_, i) => i).filter(i => i !== q.correctAnswer).sort(() => Math.random() - 0.5).slice(0, 2);
              setHiddenOptions(wrong); setLifelines(p => ({ ...p, metaMeta: 0 }));
            }}} className={`p-3 rounded-lg text-[10px] font-bold uppercase border-b-4 ${lifelines.metaMeta > 0 ? 'bg-emerald-700 border-emerald-900' : 'bg-slate-700 opacity-50'}`}>Meta ({lifelines.metaMeta})</button>
          </div>
          {hint && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
              <div className="bg-slate-800 p-8 rounded-2xl border-2 border-emerald-500 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in">
                <h4 className="text-xl font-military text-emerald-400">DICA DO SARGENTO</h4>
                <p className="text-slate-200 italic">"{hint}"</p>
                <button onClick={() => setHint(null)} className="w-full bg-emerald-600 p-3 rounded-xl font-bold uppercase border-b-4 border-emerald-800">AD SUMUS!</button>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'ranking' && (
        <div className="flex-1 flex flex-col bg-background-dark min-h-screen">
          <header className="sticky top-0 z-50 bg-slate-900/95 border-b border-slate-700 p-4 flex items-center">
            <button onClick={() => setView('menu')} className="material-symbols-outlined">arrow_back</button>
            <h2 className="flex-1 text-center font-bold uppercase text-white tracking-widest">Quadro de Honra</h2>
            <button onClick={loadGlobalRanking} className="material-symbols-outlined text-emerald-400">refresh</button>
          </header>
          <main className="flex-1 p-4 space-y-3 overflow-y-auto">
            {ranking.map((entry, i) => (
              <div key={i} className={`flex items-center gap-4 bg-slate-800/40 p-4 rounded-xl border ${entry.nickname === user?.nickname ? 'border-emerald-500' : 'border-slate-700'}`}>
                <span className="font-black text-lg w-6 text-slate-500">{i + 1}</span>
                <div className="flex-1"><p className="text-white font-bold uppercase text-sm">{entry.nickname}</p><p className={`text-[9px] font-black uppercase tracking-widest ${getRankStyle(entry.rank)}`}>{entry.rank}</p></div>
                <div className="text-right font-military text-accent-gold text-lg">{entry.score} XP</div>
              </div>
            ))}
          </main>
        </div>
      )}

      {view === 'correction' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 military-gradient min-h-screen text-center overflow-y-auto">
          <div className="bg-slate-900 border-4 border-red-600 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <h2 className="text-4xl font-military text-red-500">FOGO AMIGO!</h2>
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-700">
              <p className="text-white italic text-sm mb-3">"{wrongQuestionRef?.text}"</p>
              <div className="bg-green-900/30 p-4 rounded-xl border border-green-500">
                <p className="text-green-400 text-[9px] uppercase font-black mb-1">Gabarito Correto:</p>
                <p className="text-white font-bold text-base leading-tight">{wrongQuestionRef?.options[wrongQuestionRef.correctAnswer]}</p>
              </div>
            </div>
            <p className="text-amber-400 text-[10px] font-bold uppercase tracking-widest">Referência: {wrongQuestionRef?.reference}</p>
            <button onClick={() => setView('menu')} className="w-full bg-slate-700 p-5 rounded-xl font-military text-2xl uppercase border-b-4 border-slate-950">Voltar à Base</button>
          </div>
        </div>
      )}
    </div>
  );
}
