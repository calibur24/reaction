import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { calculateMean } from '../utils/timing';

const PAIRS = [
  ['Tea', 'Coffee'], ['Mountains', 'Beach'], ['Cats', 'Dogs'], ['Sweet', 'Savory'],
  ['Morning person', 'Night owl'], ['Books', 'Movies'], ['Summer', 'Winter'],
  ['City life', 'Countryside'], ['Pizza', 'Burger'], ['Window seat', 'Aisle seat'],
  ['Texting', 'Calling'], ['Rain', 'Sunshine'], ['Sweet tooth', 'Spicy food'],
  ['Early bird', 'Last minute'], ['Adventure', 'Relaxation'], ['Rock music', 'Pop music'],
  ['Board games', 'Video games'], ['Cycling', 'Driving'], ['Chocolate', 'Vanilla'],
  ['Solo travel', 'Group travel'], ['Introvert', 'Extrovert'], ['Comedy', 'Thriller'],
  ['Handwriting', 'Typing'], ['Home cooked', 'Takeout'], ['Planner', 'Spontaneous'],
  ['Cold drinks', 'Hot drinks'], ['Dog park', 'Cat cafe'], ['Fiction', 'Non-fiction'],
  ['Sneakers', 'Sandals'], ['Sunrise', 'Sunset'],
];

// Generates 5 randomized trials per session with shuffled prompt targets and button positions
function generateSessionTrials() {
  const shuffledBank = [...PAIRS].sort(() => Math.random() - 0.5);
  const selectedPairs = shuffledBank.slice(0, 5);

  return selectedPairs.map(([optA, optB]) => {
    // Pick one option at random as the required target
    const target = Math.random() < 0.5 ? optA : optB;
    // Shuffle button positions (Left vs Right)
    const options = Math.random() < 0.5 ? [optA, optB] : [optB, optA];

    return {
      target,
      options,
    };
  });
}

export default function DMTChallenge() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'testing' | 'completed'
  const [trials, setTrials] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [latencyResults, setLatencyResults] = useState([]);
  const [meanScore, setMeanScore] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const startTimeRef = useRef(0);

  // Initialize new test session
  const handleStartTest = () => {
    const newSession = generateSessionTrials();
    setTrials(newSession);
    setCurrentStep(0);
    setLatencyResults([]);
    setGameState('testing');
    startTimeRef.current = performance.now();
  };

  // Handle user button selection
  const handleChoice = async (selectedOption) => {
    const currentTrial = trials[currentStep];

    // Check if selection matches target stimulus
    if (selectedOption === currentTrial.target) {
      const endTime = performance.now();
      const trialLatency = Math.round((endTime - startTimeRef.current) * 100) / 100;
      const updatedResults = [...latencyResults, trialLatency];

      setLatencyResults(updatedResults);

      if (currentStep + 1 < trials.length) {
        // Move to next trial step
        setCurrentStep((prev) => prev + 1);
        startTimeRef.current = performance.now();
      } else {
        // Test complete: calculate DMT Mean metric
        const computedMean = calculateMean(updatedResults);
        setMeanScore(computedMean);
        setGameState('completed');
        await saveSessionToSupabase(computedMean, updatedResults);
      }
    }
  };

  // Persist session metrics to Supabase
  const saveSessionToSupabase = async (computedMean, rawTrials) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase.from('sessions').insert([
          {
            user_id: user.id,
            challenge_type: 'decision_making',
            score: computedMean,
            raw_trials: rawTrials,
          },
        ]);

        if (error) {
          console.error('Error saving DMT telemetry:', error.message);
        }
      }
    } catch (err) {
      console.error('Unexpected error during session save:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pt-24 pb-16 max-w-4xl mx-auto px-4 min-h-[85vh] flex flex-col justify-center items-center">
      {/* 1. IDLE STATE CARD */}
      {gameState === 'idle' && (
        <div className="dark-glass-card p-8 sm:p-12 rounded-3xl border border-zinc-800 text-center space-y-6 max-w-xl w-full">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mx-auto flex items-center justify-center text-2xl font-mono">
            ⚡
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white tracking-tight">Decision Making Test</h1>
            <p className="text-zinc-400 text-sm">
              Select the matching target option as quickly as possible across 5 dynamic trials.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStartTest}
              className="btn-pill-glow px-8 py-3 rounded-full text-sm font-semibold text-white cursor-pointer"
            >
              Start Challenge
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded-full text-sm font-semibold text-zinc-400 bg-zinc-900 hover:text-white border border-zinc-800 transition-all cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* 2. ACTIVE TESTING STATE */}
      {gameState === 'testing' && trials.length > 0 && (
        <div className="w-full max-w-2xl space-y-8">
          {/* Progress Header */}
          <div className="flex justify-between items-center text-xs font-mono text-zinc-400">
            <span>TRIAL {currentStep + 1} OF {trials.length}</span>
            <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              DMT Telemetry Active
            </span>
          </div>

          {/* Main Stimulus Card */}
          <div className="dark-glass-card p-10 rounded-3xl border border-zinc-800 text-center space-y-8">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold block">
                SELECT TARGET
              </span>
              <h2 className="text-4xl font-black text-white font-mono">
                "{trials[currentStep].target}"
              </h2>
            </div>

            {/* Dynamic Decision Choice Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {trials[currentStep].options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChoice(option)}
                  className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-purple-500 hover:bg-purple-950/20 text-lg font-bold text-white transition-all transform active:scale-95 cursor-pointer flex items-center justify-center"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. COMPLETED SCORE CARD */}
      {gameState === 'completed' && (
        <div className="dark-glass-card p-8 sm:p-12 rounded-3xl border border-zinc-800 text-center space-y-8 max-w-lg w-full">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-purple-400 font-bold block">
              TEST COMPLETED
            </span>
            <h2 className="text-3xl font-black text-white tracking-tight">Your DMT Score</h2>
          </div>

          {/* DMT Mean Output */}
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
            <p className="text-xs text-zinc-500 uppercase font-mono font-bold">DMT Mean Latency</p>
            <div className="text-5xl font-black text-white font-mono">
              {meanScore} <span className="text-xl font-normal text-zinc-500">ms</span>
            </div>
            {isSaving && (
              <p className="text-[11px] text-zinc-500 font-mono pt-2">Saving session telemetry...</p>
            )}
          </div>

          {/* Trial Breakdown */}
          <div className="space-y-2 text-left">
            <span className="text-[11px] uppercase font-bold text-zinc-500 tracking-wider">
              Trial Latencies (ms):
            </span>
            <div className="flex flex-wrap gap-2">
              {latencyResults.map((lat, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-300"
                >
                  T{idx + 1}: {lat}ms
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <button
              onClick={handleStartTest}
              className="btn-pill-glow px-6 py-3 rounded-full text-sm font-semibold text-white cursor-pointer"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded-full text-sm font-semibold text-zinc-400 bg-zinc-900 hover:text-white border border-zinc-800 transition-all cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}