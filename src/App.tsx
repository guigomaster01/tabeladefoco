/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  Settings2, 
  Zap, 
  MousePointer2, 
  AlertCircle,
  Clock,
  X
} from 'lucide-react';

// --- Types & Constants ---

interface Score {
  time: string;
  timeMs: number;
  errors: number;
  date: string;
}

const GRID_SIZE = 5;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

// --- Helper Functions ---

const formatTime = (diff: number) => {
  const min = Math.floor(diff / 60000);
  const sec = Math.floor((diff % 60000) / 1000);
  const ms = Math.floor(diff % 1000);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

const generateNumbers = () => {
  return Array.from({ length: TOTAL_CELLS }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
};

// --- Variants for Animations ---

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
    },
  },
};

const cellEntranceVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

// --- App Component ---

export default function App() {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [gameId, setGameId] = useState(0); // Used to reset animation on new game
  const [currentNumber, setCurrentNumber] = useState(1);
  const [errors, setErrors] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [mode, setMode] = useState<'click' | 'instant'>('click');
  const [leaderboard, setLeaderboard] = useState<Score[]>([]);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastScore, setLastScore] = useState<Score | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Leaderboard
  useEffect(() => {
    const saved = localStorage.getItem('schulte_scores');
    if (saved) {
      setLeaderboard(JSON.parse(saved));
    }
  }, []);

  // Timer Logic
  useEffect(() => {
    if (gameState === 'playing' && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 10);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, startTime]);

  const saveScore = useCallback((score: Score) => {
    const updated = [...leaderboard, score]
      .sort((a, b) => a.timeMs - b.timeMs || a.errors - b.errors)
      .slice(0, 5);
    setLeaderboard(updated);
    localStorage.setItem('schulte_scores', JSON.stringify(updated));
  }, [leaderboard]);

  const startNewGame = useCallback(() => {
    const newNums = generateNumbers();
    setNumbers(newNums);
    setGameId(prev => prev + 1);
    setCurrentNumber(1);
    setErrors(0);
    setElapsedTime(0);
    setStartTime(null);
    setShowResultModal(false);
    
    if (mode === 'instant') {
      const now = Date.now();
      setStartTime(now);
      setGameState('playing');
    } else {
      setGameState('idle');
    }
  }, [mode]);

  // Initial generation
  useEffect(() => {
    startNewGame();
  }, []);

  const handleCellClick = (clickedNum: number) => {
    if (gameState === 'finished') return;

    // First click logic
    if (mode === 'click' && currentNumber === 1 && clickedNum === 1 && !startTime) {
      const now = Date.now();
      setStartTime(now);
      setGameState('playing');
    }

    if (clickedNum === currentNumber) {
      if (currentNumber === TOTAL_CELLS) {
        // Win!
        const finalTimeMs = Date.now() - (startTime || Date.now());
        const score: Score = {
          time: formatTime(finalTimeMs),
          timeMs: finalTimeMs,
          errors,
          date: new Date().toLocaleDateString('pt-BR')
        };
        setGameState('finished');
        setLastScore(score);
        saveScore(score);
        setTimeout(() => setShowResultModal(true), 400); // Small delay for cleaner feel

        // Easter Egg Audio
        if (mode === 'instant' && finalTimeMs <= 10000) {
          audioRef.current?.play().catch(() => {});
        }
      } else {
        setCurrentNumber(prev => prev + 1);
      }
    } else {
      if (gameState === 'playing' || (mode === 'click' && clickedNum !== 1)) {
        setErrors(prev => prev + 1);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <audio ref={audioRef} src="https://www.myinstants.com/media/sounds/tu-tu-tu-du-max-verstappen.mp3" />

      <main className="w-full max-w-lg bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

        <header className="text-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent"
          >
            Schulte Focus
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-sm mt-2 font-medium"
          >
            Treine sua percepção e velocidade periférica
          </motion.p>
        </header>

        {/* Mode Selector */}
        <div className="bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800 flex gap-2 mb-8 relative">
          <motion.div 
            layout
            className="absolute inset-y-1.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/20"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            style={{ 
              width: "calc(50% - 0.5625rem)", 
              left: mode === 'click' ? "0.375rem" : "calc(50% + 0.1875rem)"
            }}
          />
          <button
            onClick={() => { setMode('click'); startNewGame(); }}
            className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-colors duration-300 ${
              mode === 'click' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MousePointer2 size={16} />
            <span className="text-sm font-semibold">1º Clique</span>
          </button>
          <button
            onClick={() => { setMode('instant'); startNewGame(); }}
            className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-colors duration-300 ${
              mode === 'instant' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap size={16} />
            <span className="text-sm font-semibold">Imediato</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.div layout className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl group flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1 group-hover:text-blue-400 transition-colors">Tempo Total</span>
            <span className="text-2xl font-mono font-bold text-slate-200">{formatTime(elapsedTime)}</span>
          </motion.div>
          <motion.div layout className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl group flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1 group-hover:text-red-400 transition-colors">Erros</span>
            <span className={`text-2xl font-mono font-bold ${errors > 0 ? 'text-red-400' : 'text-slate-200'}`}>{errors}</span>
          </motion.div>
        </div>

        {/* The Grid */}
        <motion.div 
          key={gameId}
          variants={gridVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-5 gap-2.5 p-3 bg-slate-950/40 rounded-2xl border border-slate-800 isolate shadow-inner"
        >
          {numbers.map((num, i) => (
            <Cell 
              key={`${num}-${i}`}
              num={num}
              isCorrect={num < currentNumber}
              isNext={num === currentNumber}
              onClick={() => handleCellClick(num)}
              gameActive={gameState !== 'finished'}
            />
          ))}
        </motion.div>

        {/* Action Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={startNewGame}
          className="w-full mt-8 bg-slate-100 hover:bg-white text-slate-950 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg active:shadow-none"
        >
          <RotateCcw size={20} />
          Reiniciar Desafio
        </motion.button>

        {/* Leaderboard Section */}
        <div className="mt-10 border-t border-slate-800/50 pt-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-1.5 bg-yellow-500/10 rounded-lg">
              <Trophy size={18} className="text-yellow-500" />
            </div>
            <h3 className="font-bold text-slate-200">Hall da Fama</h3>
          </div>
          
          <div className="space-y-2.5">
            <AnimatePresence initial={false}>
              {leaderboard.length > 0 ? leaderboard.map((s, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  layout
                  transition={{ delay: i * 0.05 }}
                  key={`${s.date}-${s.timeMs}-${i}`}
                  className="flex items-center justify-between p-3.5 bg-slate-950/30 border border-slate-800/50 rounded-xl hover:border-slate-700 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-black w-5 ${i === 0 ? 'text-yellow-500 scale-110' : 'text-slate-500'}`}>#0{i+1}</span>
                    <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{s.date}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/5 border border-red-500/10 opacity-60 group-hover:opacity-100 transition-opacity">
                      <AlertCircle size={10} className="text-red-500" />
                      <span className="text-[10px] font-bold text-red-400">{s.errors}</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-blue-400">{s.time}</span>
                  </div>
                </motion.div>
              )) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-6 border-2 border-dashed border-slate-800 p-8 rounded-2xl"
                >
                  <p className="text-slate-600 text-sm font-medium italic">Nenhum recorde estabelecido ainda.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Result Modal */}
      <AnimatePresence>
        {showResultModal && lastScore && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
              onClick={() => setShowResultModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-cyan-400" />
              
              <motion.div 
                initial={{ rotate: -15, scale: 0.5 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6"
              >
                <Trophy size={40} className="text-blue-400" />
              </motion.div>

              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                {mode === 'instant' && lastScore.timeMs <= 10000 ? "NÍVEL MAX!" : "Excelente!"}
              </h2>
              <p className="text-slate-400 text-sm mb-8 font-medium">Desafio concluído com sucesso.</p>

              <div className="space-y-3 mb-8">
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800"
                >
                  <div className="flex items-center gap-3 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                    <Clock size={14} /> Tempo
                  </div>
                  <span className="font-mono text-xl font-bold text-blue-400">{lastScore.time}</span>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800"
                >
                  <div className="flex items-center gap-3 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                    <AlertCircle size={14} /> Erros
                  </div>
                  <span className="font-mono text-xl font-bold text-red-400">{lastScore.errors}</span>
                </motion.div>
              </div>

              <button
                onClick={() => setShowResultModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-blue-900/40 active:scale-95"
              >
                Voltar ao Início
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-components ---

interface CellProps {
  num: number;
  isCorrect: boolean;
  isNext: boolean;
  onClick: () => void;
  gameActive: boolean;
}

function Cell({ num, isCorrect, isNext, onClick, gameActive }: CellProps) {
  const [isError, setIsError] = useState(false);

  const handleClick = () => {
    if (!gameActive || isCorrect) return;
    if (!isNext) {
      setIsError(true);
      setTimeout(() => setIsError(false), 300);
    }
    onClick();
  };

  return (
    <motion.button
      variants={cellEntranceVariants}
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      className={`
        aspect-square rounded-xl text-xl font-bold transition-all duration-300 border
        flex items-center justify-center relative overflow-hidden group
        ${isCorrect ? 'bg-blue-600 border-blue-500 text-white shadow-inner opacity-40 translate-y-0.5' : 
          isError ? 'bg-red-500 border-red-500 text-white animate-shake' : 
          'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700 hover:-translate-y-0.5 active:translate-y-0 shadow-lg'}
      `}
    >
      <span className="relative z-10">{num}</span>
      
      {/* Subtle hover effect */}
      {!isCorrect && <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />}
      
      {isCorrect && (
         <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute inset-0 bg-blue-400/10 flex items-center justify-center"
         />
      )}
    </motion.button>
  );
}


// Adicionando um keyframe para o shake de erro no tailwind global ou aqui via inline style
// Mas como estamos no React de luxo, vamos apenas garantir que as classes existam.
