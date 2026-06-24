// src/pages/Login.jsx — NutriRPG Web Admin
import React, { useState } from 'react';
import '../styles/components.css';

const LAST_USER_KEY = 'nutrirpg_last_user';

const Login = ({ onLogin, onRegister }) => {
  const [email,    setEmail]    = useState(() => localStorage.getItem(LAST_USER_KEY) || '');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao autenticar');
      if (data.user.role !== 'nutritionist' && data.user.role !== 'admin') {
        throw new Error('Acesso reservado a nutricionistas');
      }
      localStorage.setItem(LAST_USER_KEY, email);
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center">
      <div className="px-card px-card--lg" style={{ width: '100%', maxWidth: 380 }}>

        <div className="px-logo-block">
          <h1 className="px-logo-text">NUTRIRPG</h1>
          <div className="px-logo-scan" />
        </div>

        <p className="px-portal-sub">[ PORTAL DO NUTRICIONISTA ]</p>

        {error && (
          <div className="px-error">
            <span style={{ fontWeight: 'bold' }}>✕</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="px-label">Email ou Username</label>
          <input
            className="px-input"
            type="text"
            placeholder="nutricionista@email.com"
            autoComplete="username"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label className="px-label">PASSWORD</label>
          <input
            className="px-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <PixelBtn type="submit" disabled={loading} className="px-btn px-btn--full" style={{ marginTop: 8 }}>
            {loading ? '[ A ENTRAR... ]' : 'ENTRAR'}
          </PixelBtn>
        </form>

        <div className="px-divider">
          <span className="px-divider__line" />
          <span className="px-divider__text">ou</span>
          <span className="px-divider__line" />
        </div>

        <button className="px-link-btn" onClick={onRegister}>
          Criar conta de Nutricionista →
        </button>
      </div>
    </div>
  );
};

const PixelBtn = ({ children, className = '', style, ...props }) => {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      className={`px-btn ${pressed ? 'px-btn--pressed' : ''} ${className}`}
      style={style}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      {...props}
    >
      {children}
    </button>
  );
};

export default Login;
