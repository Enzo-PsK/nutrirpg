// src/pages/Register.jsx — NutriRPG Registo de Nutricionista
import React, { useState } from 'react';
import '../styles/components.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3000'; // set via .env.development / .env.production

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

const Register = ({ onRegistered, onBackToLogin }) => {
  const [form,    setForm]    = useState({ first_name: '', last_name: '', email: '', password: '', confirm: '' });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.first_name || !form.last_name || !form.email || !form.password || !form.confirm) {
      return setError('Todos os campos são obrigatórios');
    }
    if (form.password !== form.confirm) return setError('As passwords não coincidem');
    if (form.password.length < 6) return setError('A password deve ter pelo menos 6 caracteres');

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/register-nutritionist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao registar');
      setSuccess('Conta criada! A redirecionar...');
      setTimeout(() => onRegistered(data.token), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'first_name', label: 'PRIMEIRO NOME',     type: 'text',     placeholder: 'ex: João' },
    { key: 'last_name',  label: 'ÚLTIMO NOME',        type: 'text',     placeholder: 'ex: Silva' },
    { key: 'email',      label: 'EMAIL',              type: 'email',    placeholder: 'nutricionista@email.com' },
    { key: 'password',   label: 'PASSWORD',           type: 'password', placeholder: 'Mínimo 6 caracteres' },
    { key: 'confirm',    label: 'CONFIRMAR PASSWORD', type: 'password', placeholder: 'Repetir password' },
  ];

  return (
    <div className="page-center">
      <div className="px-card px-card--lg" style={{ width: '100%', maxWidth: 400 }}>

        <div className="px-logo-block">
          <h1 className="px-logo-text">NUTRIRPG</h1>
          <div className="px-logo-scan" />
        </div>

        <p className="px-portal-sub">[ REGISTO DE NUTRICIONISTA ]</p>

        {error   && <div className="px-error"><span style={{ fontWeight: 'bold' }}>✕</span> {error}</div>}
        {success && <div className="px-success"><span style={{ fontWeight: 'bold' }}>✓</span> {success}</div>}

        <form onSubmit={handleSubmit}>
          {fields.map(f => (
            <div key={f.key}>
              <label className="px-label">{f.label}</label>
              <input
                className="px-input"
                type={f.type}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={set(f.key)}
                required
              />
            </div>
          ))}

          <PixelBtn type="submit" disabled={loading} className="px-btn--full" style={{ marginTop: 8 }}>
            {loading ? '[ A REGISTAR... ]' : 'CRIAR CONTA'}
          </PixelBtn>
        </form>

        <button className="px-link-btn" style={{ paddingTop: 12 }} onClick={onBackToLogin}>
          ← Voltar ao Login
        </button>
      </div>
    </div>
  );
};

export default Register;
