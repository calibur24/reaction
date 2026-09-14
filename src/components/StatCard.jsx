import React from 'react';

export default function StatCard({ label, value, subtext, color = 'emerald' }) {
  const colorMap = {
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    teal: 'text-teal-400 border-teal-500/20 bg-teal-500/5',
    indigo: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5',
  };

  return (
    <div className={`p-4 rounded-2xl border ${colorMap[color]} space-y-1`}>
      <span className="text-xs text-slate-400 font-medium block uppercase tracking-wider">{label}</span>
      <span className={`text-2xl font-extrabold ${colorMap[color].split(' ')[0]}`}>{value}</span>
      {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
    </div>
  );
}