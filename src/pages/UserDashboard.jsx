import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [userHandle, setUserHandle] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [rtData, setRtData] = useState([]);
  const [dmtData, setDmtData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserSessions() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Extract handle from email or user metadata
      const email = user.email || '';
      const handle = email ? email.split('@')[0] : user.id.slice(0, 8);
      setUserHandle(handle);
      setUserEmail(email);
      setIsAdmin(user.user_metadata?.role === 'admin');

      // Fetch user sessions ordered by creation time
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading dashboard sessions:', error.message);
      } else if (sessions) {
        // Filter and format RT Sessions (Reaction Time)
        const formattedRt = sessions
          .filter((s) => s.challenge_type === 'reaction_time')
          .map((s, idx) => ({
            session: `Session ${idx + 1}`,
            score: Number(s.score),
            date: new Date(s.created_at).toLocaleDateString(),
          }));

        // Filter and format DMT Sessions (Decision Making Time)
        const formattedDmt = sessions
          .filter((s) => s.challenge_type === 'decision_making')
          .map((s, idx) => ({
            session: `Session ${idx + 1}`,
            score: Number(s.score),
            date: new Date(s.created_at).toLocaleDateString(),
          }));

        setRtData(formattedRt);
        setDmtData(formattedDmt);
      }

      setLoading(false);
    }

    fetchUserSessions();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="pt-24 pb-16 max-w-6xl mx-auto space-y-12 px-4">
      {/* Top User Bar & Sign Out Control */}
      <div className="dark-glass-card p-4 sm:p-6 rounded-3xl border border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white uppercase font-mono">
            {userHandle ? userHandle.charAt(0) : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Logged in as:</span>
              <h2 className="text-base font-bold text-white font-mono">{userHandle || 'User'}</h2>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white text-black">
                  Admin
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">{userEmail}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="px-5 py-2 rounded-full text-xs font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800 hover:text-white hover:border-zinc-600 transition-all cursor-pointer w-full sm:w-auto text-center"
        >
          Sign Out
        </button>
      </div>

      {/* Hero Header Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-4">
        <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          Your All-in-One <br />
          <span className="bg-linear-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Cognitive Suite
          </span>
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base">
          Measure sub-millisecond reaction times and decision latencies.
        </p>

        {/* Dual Glowing CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => navigate('/rt-test')}
            className="btn-pill-glow px-6 py-3 rounded-full text-sm font-semibold text-white cursor-pointer w-full sm:w-auto"
          >
            Start Reaction Test
          </button>
          <button
            onClick={() => navigate('/dmt-test')}
            className="btn-pill-glow px-6 py-3 rounded-full text-sm font-semibold text-white cursor-pointer w-full sm:w-auto"
          >
            Start Decision Making Test
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* METRIC 01: Reaction Time Trend */}
        <div className="dark-glass-card p-6 rounded-3xl space-y-4 border border-zinc-800">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block">
                METRIC 01
              </span>
              <h3 className="text-lg font-bold text-white">Reaction Time Trend</h3>
            </div>
            <span className="text-xs font-mono text-zinc-500">Median (ms)</span>
          </div>

          <div className="h-64 border border-dashed border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center bg-black/20 overflow-hidden relative">
            {loading ? (
              <p className="text-xs text-zinc-500 font-mono">Loading telemetry...</p>
            ) : rtData.length > 0 ? (
              <div className="w-full h-full p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rtData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="session" stroke="#71717a" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#71717a" tick={{ fontSize: 10 }} unit="ms" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                      itemStyle={{ color: '#60a5fa' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-xs text-zinc-500 font-mono">No session metrics recorded yet.</p>
                <button
                  onClick={() => navigate('/rt-test')}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition-all cursor-pointer"
                >
                  Take Test
                </button>
              </div>
            )}
          </div>
        </div>

        {/* METRIC 02: Decision Making Speed */}
        <div className="dark-glass-card p-6 rounded-3xl space-y-4 border border-zinc-800">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block">
                METRIC 02
              </span>
              <h3 className="text-lg font-bold text-white">Decision Making Speed</h3>
            </div>
            <span className="text-xs font-mono text-zinc-500">Mean (ms)</span>
          </div>

          <div className="h-64 border border-dashed border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center bg-black/20 overflow-hidden relative">
            {loading ? (
              <p className="text-xs text-zinc-500 font-mono">Loading telemetry...</p>
            ) : dmtData.length > 0 ? (
              <div className="w-full h-full p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dmtData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="session" stroke="#71717a" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#71717a" tick={{ fontSize: 10 }} unit="ms" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                      itemStyle={{ color: '#c084fc' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#a855f7" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-xs text-zinc-500 font-mono">No session metrics recorded yet.</p>
                <button
                  onClick={() => navigate('/dmt-test')}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition-all cursor-pointer"
                >
                  Take Test
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}