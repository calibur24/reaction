import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { calculateMedian, filterRTOutliers } from '../utils/timing';

export default function RTChallenge() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('idle'); // idle | waiting | active | complete
  const [activeCell, setActiveCell] = useState(null);
  const [trials, setTrials] = useState([]);
  const [sessionMedian, setSessionMedian] = useState(null);
  const [warningMessage, setWarningMessage] = useState('');

  const startTimeRef = useRef(0);
  const timerTimeoutRef = useRef(null);
  const TOTAL_TRIALS = 10;

  const startNextTrial = () => {
    setWarningMessage('');
    setActiveCell(null);
    setGameState('waiting');

    const randomDelay = Math.floor(Math.random() * 2500) + 1500;
    timerTimeoutRef.current = setTimeout(() => {
      setActiveCell(Math.floor(Math.random() * 9));
      setGameState('active');
      requestAnimationFrame(() => {
        startTimeRef.current = performance.now();
      });
    }, randomDelay);
  };

  const handleCellClick = (index) => {
    if (gameState === 'waiting') {
      clearTimeout(timerTimeoutRef.current);
      setWarningMessage('Too early! Wait for the target glow.');
      setGameState('idle');
      return;
    }

    if (gameState === 'active') {
      const duration = performance.now() - startTimeRef.current;
      if (index !== activeCell) return;

      const updated = [...trials, duration];
      setTrials(updated);

      if (updated.length >= TOTAL_TRIALS) {
        completeSession(updated);
      } else {
        startNextTrial();
      }
    }
  };

 const completeSession = async (allTrials) => {
  const valid = filterRTOutliers(allTrials);
  const medianScore = calculateMedian(valid);

  // Fallback check to prevent NaN payload errors
  const safeScore = isNaN(medianScore) || !isFinite(medianScore) ? 0 : Math.round(medianScore);
  
  setSessionMedian(safeScore);
  setGameState('complete');

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Session write failed: User authentication missing.');
    return;
  }

  // Format payload cleanly for PostgREST
  const payload = {
    user_id: user.id,
    challenge_type: 'reaction_time',
    score: safeScore,
    raw_trials: allTrials.map((t) => Math.round(t)), // Ensure pure numeric values
  };

  const { data, error } = await supabase
    .from('sessions')
    .insert([payload])
    .select();

  if (error) {
    console.error('Supabase 400 Payload Error Details:', error);
  } else {
    console.log('Successfully recorded session:', data);
  }
};

  useEffect(() => {
    return () => clearTimeout(timerTimeoutRef.current);
  }, []);

  return (
    <div className="pt-28 pb-16 max-w-xl mx-auto space-y-8 text-center">
      <div className="space-y-2">
        <h2 className="text-4xl font-bold tracking-tight text-white">
          Reaction Time Challenge
        </h2>
        <p className="text-zinc-400 text-sm">
          Tap the highlighted target card as quickly as possible across {TOTAL_TRIALS} trials.
        </p>
      </div>

      {/* Telemetry Status Pill Bar */}
      <div className="dark-glass-card p-4 rounded-full flex justify-between items-center px-8 text-sm font-medium">
        <span className="text-zinc-400">
          Trial: <strong className="text-white font-mono">{trials.length} / {TOTAL_TRIALS}</strong>
        </span>
        <span className="text-zinc-400">
          Latest: <strong className="text-white font-mono">{trials.length > 0 ? `${Math.round(trials[trials.length - 1])} ms` : '--'}</strong>
        </span>
      </div>

      {warningMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-semibold">
          {warningMessage}
        </div>
      )}

      {gameState !== 'complete' ? (
        <div className="space-y-6">
          {/* 3x3 Target Grid */}
          <div className="grid grid-cols-3 gap-4 dark-glass-panel p-6 rounded-3xl aspect-square touch-action-none">
            {Array.from({ length: 9 }).map((_, i) => (
              <button
                key={i}
                onClick={() => handleCellClick(i)}
                disabled={gameState === 'idle'}
                className={`rounded-2xl transition-all duration-75 cursor-pointer ${
                  activeCell === i && gameState === 'active'
                    ? 'bg-white shadow-[0_0_30px_rgba(255,255,255,0.8)] border-2 border-white scale-105'
                    : 'dark-glass-card hover:border-zinc-500'
                }`}
              />
            ))}
          </div>

          {gameState === 'idle' && (
            <button
              onClick={startNextTrial}
              className="w-full btn-pill-glow py-4 rounded-full text-sm font-semibold text-white cursor-pointer"
            >
              Start Reaction Test
            </button>
          )}

          {gameState === 'waiting' && (
            <p className="text-zinc-400 text-sm font-mono animate-pulse">Wait for target highlight...</p>
          )}
        </div>
      ) : (
        /* Completion Card */
        <div className="dark-glass-panel p-8 rounded-3xl space-y-6">
          <h3 className="text-2xl font-bold text-white">Session Complete</h3>
          <p className="text-zinc-400 text-sm">Your overall median Reaction Time:</p>
          <div className="text-6xl font-black text-white font-mono py-2">
            {sessionMedian} <span className="text-2xl text-zinc-500 font-normal">ms</span>
          </div>
          
          <div className="flex gap-4 pt-2">
            <button
              onClick={() => { setTrials([]); setGameState('idle'); }}
              className="flex-1 py-3.5 rounded-full text-xs font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800 hover:text-white transition-colors"
            >
              Retake Test
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 btn-pill-glow py-3.5 rounded-full text-xs font-semibold text-white"
            >
              View Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}