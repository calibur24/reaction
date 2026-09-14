import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react";
import UserDashboard from './pages/UserDashboard';
import RTChallenge from './pages/RTChallenge';
import DMTChallenge from './pages/DMTChallenge';
import AdminPortal from './pages/AdminPortal';
import AuthLogin from './pages/AuthLogin';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black text-white font-sans antialiased selection:bg-white selection:text-black">
        <Routes>
          <Route path="/" element={<AuthLogin />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/rt-test" element={<RTChallenge />} />
          <Route path="/dmt-test" element={<DMTChallenge />} />
          <Route path="/admin" element={<AdminPortal />} />
          {/* Fallback to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Analytics />
      </div>
    </Router>
  );
}