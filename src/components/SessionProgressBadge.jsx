import React from 'react';

export default function SessionProgressBadge({ title, onClick }) {
  return (
    <div className="h-48 flex flex-col items-center justify-center text-center p-6 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800 space-y-3">
      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-lg">
        🔒
      </div>
      <div>
        <p className="text-slate-300 font-semibold text-sm">{title} Graph Locked</p>
        <p className="text-slate-500 text-xs mt-0.5">Complete at least 1 session to start tracking your performance trend.</p>
      </div>
      <button
        onClick={onClick}
        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all"
      >
        Start Challenge Now
      </button>
    </div>
  );
}