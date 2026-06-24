// src/App.js — NutriRPG Web Admin
import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'nutrirpg_token';

export default function App() {
  const [token,   setToken]   = useState(null);
  const [page,    setPage]    = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(true);   // validating stored token

  // On mount: read stored token and verify it's still valid
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    // Verify token against the backend — if invalid/expired, clear it
    fetch(`${API}/api/user/profile`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then(res => {
        if (res.ok) {
          setToken(stored); // valid — restore session
        } else {
          localStorage.removeItem(TOKEN_KEY); // expired / revoked
        }
      })
      .catch(() => {
        // Network error: keep token and let user retry from Dashboard
        setToken(stored);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = (t) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setPage('login');
  };

  if (loading) return <LoadingScreen />;
  if (token)   return <Dashboard token={token} onLogout={handleLogout} />;
  if (page === 'register') {
    return <Register onRegistered={handleLogin} onBackToLogin={() => setPage('login')} />;
  }
  return <Login onLogin={handleLogin} onRegister={() => setPage('register')} />;
}

const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Courier New', Courier, monospace",
    gap: 20,
  }}>
    <div style={{
      width: 56, height: 56,
      backgroundColor: '#e94560',
      border: '2px solid #000',
      boxShadow: '4px 4px 0 #000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 26,
    }}>⚔️</div>
    <div style={{ color: '#111111', fontSize: 14, letterSpacing: 3 }}>[ A CARREGAR... ]</div>
    <div style={{
      width: 160, height: 6,
      backgroundColor: '#e5e7eb',
      border: '2px solid #000',
      overflow: 'hidden',
    }}>
      <div style={{
        height: '100%',
        backgroundColor: '#e94560',
        animation: 'pulse 1s ease-in-out infinite',
        width: '60%',
      }} />
    </div>
  </div>
);
