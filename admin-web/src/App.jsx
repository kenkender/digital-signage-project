// App.jsx
// จัดการ navigation ระหว่างหน้า Dashboard / Upload / Playlist + auth

import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import UploadContent from './pages/UploadContent.jsx';
import PlaylistManager from './pages/PlaylistManager.jsx';
import ControlDashboard from './pages/ControlDashboard.jsx';
import axios from 'axios';

const App = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [token, setToken] = useState('');
  const [tenantId, setTenantId] = useState('default');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('token') || '';
    const savedTenant = localStorage.getItem('tenantId') || 'default';
    setToken(savedToken);
    setTenantId(savedTenant);
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'https://digital-signage-project.onrender.com/api'}/auth/login`,
        { username: loginForm.username, password: loginForm.password }
      );
      const t = res.data.token;
      const u = res.data.user?.username || loginForm.username;
      setToken(t);
      setTenantId(u);
      localStorage.setItem('token', t);
      localStorage.setItem('tenantId', u);
      axios.defaults.headers.common.Authorization = `Bearer ${t}`;
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleLogout = () => {
    setToken('');
    setTenantId('default');
    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');
    delete axios.defaults.headers.common.Authorization;
  };

  const renderPage = () => {
    const commonProps = { token, tenantId };
    switch (activePage) {
      case 'upload':
        return <UploadContent {...commonProps} />;
      case 'playlist':
        return <PlaylistManager {...commonProps} />;
      case 'control':
        return <ControlDashboard {...commonProps} />;
      case 'dashboard':
      default:
        return <Dashboard {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-100 app-gradient">
      <Navbar activePage={activePage} onChangePage={setActivePage} />
      <main className="flex-1 p-6 w-full max-w-screen-2xl mx-auto space-y-4">
        {!token && (
          <form
            onSubmit={handleLogin}
            className="max-w-lg mx-auto bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-3"
          >
            <h3 className="text-lg font-semibold">Login (จำเป็นสำหรับ upload/publish)</h3>
            <input
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
              placeholder="Username"
              value={loginForm.username}
              onChange={(e) =>
                setLoginForm((p) => ({ ...p, username: e.target.value }))
              }
            />
            <input
              type="password"
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm((p) => ({ ...p, password: e.target.value }))
              }
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-accent text-white font-semibold"
            >
              Login
            </button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </form>
        )}

        {token && (
          <div className="flex items-center justify-between bg-slate-900/70 border border-slate-800 p-3 rounded-xl">
            <div className="text-sm text-slate-200">
              Logged in as <span className="font-semibold">{tenantId}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
            >
              Logout
            </button>
          </div>
        )}

        {renderPage()}
      </main>
    </div>
  );
};

export default App;
