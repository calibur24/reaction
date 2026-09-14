import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Navbar({ session }) {
  const location = useLocation();

  // Check if current authenticated user has the 'admin' role
  const isAdmin = session?.user?.user_metadata?.role === 'admin';
  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-full flex justify-center pt-6 px-4 fixed top-0 left-0 right-0 z-50">
      <nav className="w-full max-w-4xl dark-glass-panel rounded-full px-6 py-3 flex justify-between items-center border border-zinc-800 bg-black/80 backdrop-blur-md">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-linear-to-tr from-zinc-500 via-white to-zinc-300 flex items-center justify-center text-black font-black text-xs shadow-inner">
            N
          </div>
          <span className="font-bold text-base text-white tracking-tight">NeuralTiming</span>
        </Link>

        {/* Dynamic Navigation Links */}
        <div className="flex items-center gap-8 text-sm font-medium">
          {session && (
            <>
              <Link
                to="/dashboard"
                className={`transition-colors ${isActive('/dashboard') ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'}`}
              >
                Dashboard
              </Link>
              <Link
                to="/rt-test"
                className={`transition-colors ${isActive('/rt-test') ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'}`}
              >
                RT Test
              </Link>
              <Link
                to="/dmt-test"
                className={`transition-colors ${isActive('/dmt-test') ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'}`}
              >
                DMT Test
              </Link>
            </>
          )}

          {/* Admin link renders ONLY when logged in as an Admin */}
          {session && isAdmin && (
            <Link
              to="/admin"
              className={`transition-colors ${isActive('/admin') ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'}`}
            >
              Admin Portal
            </Link>
          )}
        </div>

        {/* Auth Action */}
        <div>
          {session ? (
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-5 py-2 rounded-full text-xs font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800 hover:text-white hover:border-zinc-500 transition-all cursor-pointer"
            >
              Sign Out
            </button>
          ) : (
            <Link
              to="/"
              className="btn-pill-glow px-5 py-2 rounded-full text-xs font-semibold text-white inline-block"
            >
              Get Started Now
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}