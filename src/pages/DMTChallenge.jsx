import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { calculateMean, filterDMTOutliers } from '../utils/timing';
const PREFERENCE_PAIRS = [
  { id: 1, optionA: '☀️ Early Morning', optionB: '🌙 Late Night' },
  { id: 2, optionA: '☕ Coffee', optionB: '🍵 Tea' },
  { id: 3, optionA: '🏔️ Mountain Hike', optionB: '🏖️ Ocean Beach' },
  { id: 4, optionA: '📚 Read a Book', optionB: '🎬 Watch a Movie' },
  { id: 5, optionA: '🧠 Deep Focus', optionB: '⚡ Fast Action' },
];

export default function DMTChallenge() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trials, setTrials] = useState([]);
  const [gameState, setGameState] = useState('idle'); // idle | active | complete
  const [sessionMean, setSessionMean] = useState(null);

  const startTimeRef = useRef(0);

  const startChallenge = () => {
    setTrials([]);
    setCurrentIndex(0);
    setGameState('active');
    startTimeRef.current = performance.now();
  };

  const handleSelection = () => {
    const duration = performance.now() - startTimeRef.current;
    const updatedTrials = [...trials, duration];
    setTrials(updatedTrials);

    if (currentIndex + 1 < PREFERENCE_PAIRS.length) {
      setCurrentIndex(currentIndex + 1);
      startTimeRef.current = performance.now();
    } else {
      completeSession(updatedTrials);
    }
  };

 const completeSession = async (allTrials) => {
  // Use filterDMTOutliers instead of filterRTOutliers
  const validTrials = filterDMTOutliers(allTrials);
  const meanScore = calculateMean(validTrials);

  const safeScore = isNaN(meanScore) || !isFinite(meanScore) ? 0 : Math.round(meanScore);

  setSessionMean(safeScore);
  setGameState('complete');

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Session write failed: User authentication missing.');
    return;
  }

  const payload = {
    user_id: user.id,
    challenge_type: 'decision_making',
    score: safeScore,
    raw_trials: allTrials.map((t) => Math.round(t)),
  };

  const { data, error } = await supabase
    .from('sessions')
    .insert([payload])
    .select();

  if (error) {
    console.error('Supabase Session Insert Error:', error.message);
  } else {
    console.log('Successfully recorded DMT session:', data);
  }
};
  return (
    <div className="pt-28 pb-16 max-w-xl mx-auto space-y-8 text-center">
      <div className="space-y-2">
        <h2 className="text-4xl font-bold tracking-tight text-white">
          Decision Making Time
        </h2>
        <p className="text-zinc-400 text-sm">
          Select your gut preference as quickly as possible. 5 rapid choice pairs.
        </p>
      </div>

      {gameState === 'idle' && (
        <div className="dark-glass-panel p-8 rounded-3xl space-y-6">
          <p className="text-zinc-400 text-sm leading-relaxed">
            There are no right or wrong options. Make immediate binary decisions to test neural latency.
          </p>
          <button
            onClick={startChallenge}
            className="w-full btn-pill-glow py-4 rounded-full text-sm font-semibold text-white cursor-pointer"
          >
            Start Decision Challenge
          </button>
        </div>
      )}

      {gameState === 'active' && (
        <div className="space-y-6">
          <div className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase">
            Pair {currentIndex + 1} of {PREFERENCE_PAIRS.length}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleSelection}
              className="dark-glass-card p-10 rounded-3xl text-lg font-bold text-white hover:border-zinc-400 transition-all cursor-pointer transform active:scale-95"
            >
              {PREFERENCE_PAIRS[currentIndex].optionA}
            </button>

            <button
              onClick={handleSelection}
              className="dark-glass-card p-10 rounded-3xl text-lg font-bold text-white hover:border-zinc-400 transition-all cursor-pointer transform active:scale-95"
            >
              {PREFERENCE_PAIRS[currentIndex].optionB}
            </button>
          </div>
        </div>
      )}

      {gameState === 'complete' && (
        <div className="dark-glass-panel p-8 rounded-3xl space-y-6">
          <h3 className="text-2xl font-bold text-white">Test Completed</h3>
          <p className="text-zinc-400 text-sm">Your mean Decision Making Time (DMT):</p>
          <div className="text-6xl font-black text-white font-mono py-2">
            {sessionMean} <span className="text-2xl text-zinc-500 font-normal">ms</span>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              onClick={startChallenge}
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