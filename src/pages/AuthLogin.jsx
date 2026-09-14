import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function AuthLogin() {
  const navigate = useNavigate();
  const [role, setRole] = useState('user');
  const [isSignUp, setIsSignUp] = useState(false);

  const [userIdInput, setUserIdInput] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('prefer_not_to_say');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
    setErrorMsg('');
    if (newRole === 'admin') {
      setIsSignUp(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // Restrict Admin Registration
    if (role === 'admin' && isSignUp) {
      setErrorMsg('Admin registration is disabled. Please contact system administrator.');
      setLoading(false);
      return;
    }

    // Standardize internal email format from custom UserID
    const formattedEmail = userIdInput.includes('@')
      ? userIdInput.trim().toLowerCase()
      : `${userIdInput.trim().toLowerCase()}@neuraltiming.internal`;

    try {
      if (isSignUp && role === 'user') {
        const { data, error } = await supabase.auth.signUp({
          email: formattedEmail,
          password: password,
          options: {
            data: {
              custom_userid: userIdInput.trim(),
              full_name: name.trim() || 'Anonymous',
              age: age ? String(age) : '24', // Ensure age is a string for pgcrypto compatibility
              sex: sex || 'prefer_not_to_say',
              role: 'user',
            },
          },
        });

        if (error) {
          if (error.message.toLowerCase().includes('already registered') || error.status === 422) {
            throw new Error('This UserID is already taken. Please choose another UserID.');
          }
          throw error;
        }

        if (data.user) {
          navigate('/dashboard');
        }
      } else {
        // Handle User & Admin Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formattedEmail,
          password: password,
        });

        if (error) throw error;

        const userRole = data.user?.user_metadata?.role;
        if (role === 'admin' && userRole !== 'admin') {
          await supabase.auth.signOut();
          throw new Error('Access Denied: Account does not have Administrative privileges.');
        }

        if (data.user) {
          navigate(userRole === 'admin' ? '/admin' : '/dashboard');
        }
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 pb-16 max-w-md mx-auto px-4">
      <div className="dark-glass-panel p-8 rounded-3xl space-y-6">
        {/* Role Toggle Switch */}
        <div className="grid grid-cols-2 gap-2 p-1.5 dark-glass-card rounded-full text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleRoleSwitch('user')}
            className={`py-2 rounded-full transition-all cursor-pointer ${
              role === 'user' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            User Portal
          </button>
          <button
            type="button"
            onClick={() => handleRoleSwitch('admin')}
            className={`py-2 rounded-full transition-all cursor-pointer ${
              role === 'admin' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Admin Portal
          </button>
        </div>

        {/* Title Section */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {role === 'admin' ? 'Administrative Access' : isSignUp ? 'Create User Account' : 'Welcome Back'}
          </h2>
          <p className="text-zinc-400 text-xs">
            {role === 'admin'
              ? 'Enter master credentials to access system telemetry'
              : isSignUp
              ? 'Fill out your profile details to register'
              : 'Sign in with your UserID and Password'}
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="p-3 text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl">
            {errorMsg}
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              User ID
            </label>
            <input
              type="text"
              required
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl dark-glass-card border border-zinc-800 focus:outline-none focus:border-zinc-500 text-white font-medium text-sm"
              placeholder={role === 'admin' ? 'admin_master' : 'e.g. calibur24'}
            />
          </div>

          {isSignUp && role === 'user' && (
            <>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl dark-glass-card border border-zinc-800 focus:outline-none focus:border-zinc-500 text-white font-medium text-sm"
                  placeholder="John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl dark-glass-card border border-zinc-800 focus:outline-none focus:border-zinc-500 text-white font-medium text-sm"
                    placeholder="24"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Sex
                  </label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl dark-glass-card border border-zinc-800 focus:outline-none focus:border-zinc-500 text-white font-medium text-sm bg-zinc-900"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl dark-glass-card border border-zinc-800 focus:outline-none focus:border-zinc-500 text-white font-medium text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-pill-glow py-3.5 rounded-full text-sm font-semibold text-white cursor-pointer mt-2"
          >
            {loading ? 'Processing...' : isSignUp ? 'Complete Registration' : 'Log In'}
          </button>
        </form>

        {/* Footer Registration Toggle */}
        {role === 'user' && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Register Here"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}