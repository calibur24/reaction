import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { calculateMedian, calculateMean } from '../utils/timing';

export default function AdminPortal() {
  const navigate = useNavigate();
  const [adminHandle, setAdminHandle] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [userList, setUserList] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [expandedUser, setExpandedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      // 0. Fetch Current Authenticated Admin Info
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const email = user.email || '';
        const handle = email ? email.split('@')[0] : user.id.slice(0, 8);
        setAdminHandle(handle);
        setAdminEmail(email);
      }

      // 1. Fetch Decrypted User Profiles (including Age & Sex)
      const { data: profilesData, error: profilesErr } = await supabase.rpc('get_admin_user_profiles', {
        secret_key: 'my_super_secret_key_2026', // DB_ENCRYPTION_SECRET
      });

      if (profilesErr) {
        console.error('Failed to fetch decrypted profiles:', profilesErr.message);
      } else if (profilesData) {
        setUserList(profilesData);
      }

      // 2. Fetch Global Sessions
      const { data: sessionsData, error: sessionsErr } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (sessionsErr) {
        console.error('Failed to fetch sessions:', sessionsErr.message);
      } else if (sessionsData) {
        setAllSessions(sessionsData);
      }

      setLoading(false);
    }

    loadAdminData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const toggleUserExpand = (userId) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  // Helper: Prepare structured rows for Exporting (Filtered to RT Median and DMT Mean only)
  const generateExportData = () => {
    const rows = [];

    userList.forEach((u) => {
      const handle = u.email ? u.email.split('@')[0] : u.user_id.slice(0, 8);
      const userSessions = allSessions.filter((s) => s.user_id === u.user_id);

      const rtSessions = userSessions.filter((s) => s.challenge_type === 'reaction_time');
      const dmtSessions = userSessions.filter((s) => s.challenge_type === 'decision_making');

      // Overall User Aggregates
      const overallRtScores = rtSessions.map((s) => Number(s.score)).filter((n) => !isNaN(n));
      const overallDmtScores = dmtSessions.map((s) => Number(s.score)).filter((n) => !isNaN(n));

      const userRtMedian = overallRtScores.length > 0 ? calculateMedian(overallRtScores) : 'N/A';
      const userDmtMean = overallDmtScores.length > 0 ? calculateMean(overallDmtScores) : 'N/A';

      if (userSessions.length === 0) {
        rows.push({
          UserID: handle,
          UserUUID: u.user_id,
          Email: u.email,
          Name: u.decrypted_name,
          Age: u.decrypted_age,
          Sex: u.decrypted_sex,
          Role: u.is_admin ? 'Admin' : 'User',
          User_Overall_RT_Median_MS: userRtMedian,
          User_Overall_DMT_Mean_MS: userDmtMean,
          SessionType: 'N/A',
          Session_Score_MS: 'N/A',
          Session_RT_Median_MS: 'N/A',
          Session_DMT_Mean_MS: 'N/A',
          RawTrials: 'N/A',
          SessionTimestamp: 'N/A',
          AccountCreated: new Date(u.created_at).toLocaleString(),
        });
      } else {
        userSessions.forEach((s) => {
          const rawNumbers = Array.isArray(s.raw_trials)
            ? s.raw_trials.map((t) => Number(t)).filter((n) => !isNaN(n))
            : [];

          const isRT = s.challenge_type === 'reaction_time';
          const isDMT = s.challenge_type === 'decision_making';

          const sessionMedian = rawNumbers.length > 0 ? calculateMedian(rawNumbers) : s.score;
          const sessionMean = rawNumbers.length > 0 ? calculateMean(rawNumbers) : s.score;

          rows.push({
            UserID: handle,
            UserUUID: u.user_id,
            Email: u.email,
            Name: u.decrypted_name,
            Age: u.decrypted_age,
            Sex: u.decrypted_sex,
            Role: u.is_admin ? 'Admin' : 'User',
            User_Overall_RT_Median_MS: userRtMedian,
            User_Overall_DMT_Mean_MS: userDmtMean,
            SessionType: isRT ? 'Reaction Time (RT)' : 'Decision Making (DMT)',
            Session_Score_MS: s.score,
            Session_RT_Median_MS: isRT ? sessionMedian : 'N/A',
            Session_DMT_Mean_MS: isDMT ? sessionMean : 'N/A',
            RawTrials: Array.isArray(s.raw_trials) ? s.raw_trials.join(' | ') : s.raw_trials || '',
            SessionTimestamp: new Date(s.created_at).toLocaleString(),
            AccountCreated: new Date(u.created_at).toLocaleString(),
          });
        });
      }
    });

    return rows;
  };

  // Download Data as CSV file
  const exportToCSV = () => {
    const data = generateExportData();
    if (data.length === 0) return alert('No data available to export.');

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Header Row
    csvRows.push(headers.join(','));

    // Data Rows
    data.forEach((row) => {
      const values = headers.map((header) => {
        const escaped = ('' + (row[header] ?? '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NeuralTiming_Telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Data as Excel (.xls XML / HTML Format)
  const exportToExcel = () => {
    const data = generateExportData();
    if (data.length === 0) return alert('No data available to export.');

    const headers = Object.keys(data[0]);

    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Telemetry</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';
    html += '<body><table border="1"><thead><tr>';

    headers.forEach((h) => {
      html += `<th style="background-color:#18181b;color:#ffffff;">${h}</th>`;
    });
    html += '</tr></thead><tbody>';

    data.forEach((row) => {
      html += '<tr>';
      headers.forEach((h) => {
        html += `<td>${row[h] ?? ''}</td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `NeuralTiming_Telemetry_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pt-24 pb-16 max-w-6xl mx-auto space-y-8 px-4">
      {/* Top Admin User Bar & Sign Out */}
      <div className="dark-glass-card p-4 sm:p-6 rounded-3xl border border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold font-mono">
            {adminHandle ? adminHandle.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Admin Account:</span>
              <h2 className="text-base font-bold text-white font-mono">{adminHandle || 'Admin'}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white text-black">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">{adminEmail}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="px-5 py-2 rounded-full text-xs font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800 hover:text-white hover:border-zinc-600 transition-all cursor-pointer w-full sm:w-auto text-center"
        >
          Sign Out
        </button>
      </div>

      {/* Main Header with Export Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-zinc-800 pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Admin Control Portal</h2>
          <p className="text-zinc-400 text-sm">Decrypted demographics and interactive user performance metrics</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>📥</span> Export CSV
          </button>
          <button
            onClick={exportToExcel}
            className="btn-pill-glow px-4 py-2 rounded-full text-xs font-semibold text-white cursor-pointer flex items-center gap-1.5"
          >
            <span>📊</span> Export Excel (.xls)
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="dark-glass-card p-6 rounded-3xl space-y-2">
          <h3 className="text-xs uppercase font-bold text-zinc-400 tracking-wider">Total Registered Users</h3>
          <p className="text-4xl font-black text-white font-mono">{userList.length}</p>
        </div>

        <div className="dark-glass-card p-6 rounded-3xl space-y-2">
          <h3 className="text-xs uppercase font-bold text-zinc-400 tracking-wider">Total Test Sessions</h3>
          <p className="text-4xl font-black text-white font-mono">{allSessions.length}</p>
        </div>

        <div className="dark-glass-card p-6 rounded-3xl space-y-2">
          <h3 className="text-xs uppercase font-bold text-zinc-400 tracking-wider">Security Vault State</h3>
          <p className="text-2xl font-bold text-emerald-400 font-mono">Encrypted (pgcrypto)</p>
        </div>
      </div>

      {/* User Profiles Table with Decrypted Demographics */}
      {loading ? (
        <div className="text-center text-zinc-500 font-mono py-12 text-sm">Loading admin telemetry...</div>
      ) : (
        <div className="dark-glass-panel rounded-3xl overflow-hidden border border-zinc-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4 w-12 text-center"></th>
                <th className="p-4">User ID</th>
                <th className="p-4">Decrypted Name</th>
                <th className="p-4">Age</th>
                <th className="p-4">Sex</th>
                <th className="p-4">Total Sessions</th>
                <th className="p-4">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-sm font-mono text-zinc-300">
              {userList.map((u) => {
                const handle = u.email ? u.email.split('@')[0] : u.user_id.slice(0, 8);
                const userSessions = allSessions.filter((s) => s.user_id === u.user_id);
                const rtCount = userSessions.filter((s) => s.challenge_type === 'reaction_time').length;
                const dmtCount = userSessions.filter((s) => s.challenge_type === 'decision_making').length;
                const isExpanded = expandedUser === u.user_id;

                return (
                  <React.Fragment key={u.user_id}>
                    {/* Main User Row */}
                    <tr
                      onClick={() => toggleUserExpand(u.user_id)}
                      className={`hover:bg-zinc-900/60 cursor-pointer transition-colors ${
                        isExpanded ? 'bg-zinc-900/80' : ''
                      }`}
                    >
                      <td className="p-4 text-center text-zinc-500 font-sans">
                        {isExpanded ? '▼' : '▶'}
                      </td>
                      <td className="p-4 font-bold text-white font-sans">{handle}</td>
                      <td className="p-4 text-xs font-sans text-white">{u.decrypted_name}</td>
                      <td className="p-4 text-xs text-zinc-300">{u.decrypted_age} yrs</td>
                      <td className="p-4 text-xs capitalize text-zinc-300">{u.decrypted_sex}</td>
                      <td className="p-4 text-xs text-zinc-400">
                        <span className="text-white font-bold">{userSessions.length}</span> total ({rtCount} RT / {dmtCount} DMT)
                      </td>
                      <td className="p-4 text-xs">
                        {u.is_admin ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-white text-black">
                            Admin
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-zinc-800 text-zinc-400">
                            User
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Collapsible Dropdown Details */}
                    {isExpanded && (
                      <tr className="bg-black/50">
                        <td colSpan="7" className="p-6">
                          <div className="dark-glass-card rounded-2xl p-4 border border-zinc-800/80 space-y-4">
                            <div className="flex justify-between items-center border-b border-zinc-800/60 pb-3">
                              <div>
                                <h4 className="text-xs uppercase font-bold text-zinc-400 tracking-wider font-sans">
                                  Profile & Telemetry details: <span className="text-white">{handle}</span>
                                </h4>
                                <p className="text-[11px] text-zinc-500 font-sans">
                                  Email: {u.email} | Age: {u.decrypted_age} | Sex: {u.decrypted_sex}
                                </p>
                              </div>
                              <span className="text-[10px] font-mono text-zinc-500">UUID: {u.user_id}</span>
                            </div>

                            {userSessions.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {userSessions.map((s, idx) => {
                                  const rawNumbers = Array.isArray(s.raw_trials)
                                    ? s.raw_trials.map((t) => Number(t)).filter((n) => !isNaN(n))
                                    : [];

                                  const isRT = s.challenge_type === 'reaction_time';
                                  const metricLabel = isRT ? 'RT Median' : 'DMT Mean';
                                  const metricVal = rawNumbers.length > 0
                                    ? (isRT ? calculateMedian(rawNumbers) : calculateMean(rawNumbers))
                                    : s.score;

                                  return (
                                    <div
                                      key={s.id || idx}
                                      className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex justify-between items-center text-xs"
                                    >
                                      <div className="space-y-1">
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                            isRT
                                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                          }`}
                                        >
                                          {isRT ? 'Reaction Time (RT)' : 'Decision Making (DMT)'}
                                        </span>
                                        <p className="text-[10px] text-zinc-500">
                                          {new Date(s.created_at).toLocaleString()}
                                        </p>
                                      </div>

                                      <div className="text-right">
                                        <div className="text-lg font-bold text-white font-mono">
                                          {s.score} <span className="text-xs font-normal text-zinc-400">ms</span>
                                        </div>
                                        <div className="text-[10px] text-zinc-400 font-mono">
                                          {metricLabel}: {metricVal}ms
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-xs text-zinc-500 italic">
                                This user has not completed any RT or DMT test sessions yet.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {userList.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-zinc-500 text-sm">
                    No user profiles found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}