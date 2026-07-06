// src/pages/Dashboard.jsx - Web Admin (Nutricionista)
import React, { useEffect, useState, useCallback } from 'react';
import '../styles/components.css';
import { PlatformAdminHome, PlatformAdminUsers } from './PlatformAdmin';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3000'; // set via .env.development / .env.production

// ---- Colours — map CSS variables to JS for dynamic inline styles ------------
// Static styles → use CSS classes from components.css
// Dynamic/conditional styles (computed borders, hover, etc.) → still use these
const C = {
  BG:     'var(--c-bg)',
  CARD:   'var(--c-card)',
  INPUT:  'var(--c-input)',
  ALT:    'var(--c-alt)',
  TEXT:   'var(--c-text)',
  WHITE:  'var(--c-white)',
  MUTED:  'var(--c-muted)',
  RED:    'var(--c-red)',
  GOLD:   'var(--c-gold)',
  BLUE:   'var(--c-blue)',
  PURPLE: 'var(--c-purple)',
  GREEN:  'var(--c-green)',
  BORDER: 'var(--c-border)',
  CYAN:   'var(--c-cyan)',
};

const authH = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

// Wrapper that auto-clears session on auth failure (401 / conta desactivada)
const apiFetch = async (url, options = {}) => {
  const res = await fetch(url, options);
  if (res.status === 401) {
    localStorage.removeItem('nutrirpg_token');
    window.location.reload();
    return res;
  }
  if (res.status === 403) {
    try {
      const data = await res.clone().json();
      const msg = data?.error || '';
      if (msg.includes('Conta desactivada') || msg.includes('Utilizador não encontrado') || msg.includes('Token inválido')) {
        localStorage.removeItem('nutrirpg_token');
        window.alert('A tua conta foi desactivada. A sessão foi terminada.');
        window.location.reload();
      }
    } catch { /* ignore */ }
  }
  return res;
};

// ---- Shared helpers ---------------------------------------------------------

const EmptyMsg = ({ children }) => (
  <p style={{ color: C.MUTED, fontSize: 13, fontStyle: 'italic', marginTop: 8 }}>{children}</p>
);

const Badge = ({ children, color = C.RED }) => (
  <span style={{
    backgroundColor: color + '22',
    color,
    border: `1px solid ${color}`,
    padding: '2px 8px',
    fontSize: 11,
    fontFamily: 'inherit',
    letterSpacing: 1,
  }}>{children}</span>
);

const filterRecipes = (list, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(r => {
    const hay = [
      r.name,
      r.description,
      r.instructions,
      ...(r.ingredients || []).map(i => i.product_name),
    ].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  });
};

const RecipeSearchInput = ({ value, onChange, placeholder = 'Pesquisar receitas...' }) => (
  <input
    type="search"
    style={{ ...S.input, marginBottom: 0 }}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
  />
);

const RecipeAccordion = ({ recipe, onDelete, deleteTitle = 'Eliminar' }) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={S.recipeAccordion}>
      <div style={S.recipeAccordionHeader}>
        <button type="button" style={S.recipeAccordionToggle} onClick={() => setOpen(v => !v)}>
          <span style={S.recipeAccordionName}>{recipe.name}</span>
          <Badge color={C.GOLD}>+{recipe.xp_reward} XP</Badge>
          <span style={S.recipeAccordionChevron}>{open ? '▲' : '▼'}</span>
        </button>
        {onDelete && (
          <button
            type="button"
            style={S.recipeAccordionDelete}
            onClick={onDelete}
            title={deleteTitle}
          >×</button>
        )}
      </div>
      {open && (
        <div style={S.recipeAccordionBody}>
          {recipe.description && (
            <p style={{ color: C.MUTED, fontSize: 13, margin: '0 0 10px', lineHeight: 1.6 }}>{recipe.description}</p>
          )}
          {recipe.ingredients?.length > 0 && (
            <div style={{ marginBottom: recipe.instructions ? 10 : 0 }}>
              <div style={S.recipeAccordionLabel}>Ingredientes</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {recipe.ingredients.map((ing, i) => (
                  <span key={i} style={S.ingTag}>{ing.product_name} — {ing.quantity} {ing.unit}</span>
                ))}
              </div>
            </div>
          )}
          {recipe.instructions && (
            <div>
              <div style={S.recipeAccordionLabel}>Instruções</div>
              <p style={{ color: C.TEXT, fontSize: 13, margin: 0, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{recipe.instructions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Pixel button with press animation
const PixelBtn = ({ children, onClick, type = 'button', disabled, color = C.RED, outline = false, small = false, style }) => {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        backgroundColor: outline ? 'transparent' : color,
        color: outline ? color : C.WHITE,
        border: `2px solid ${outline ? color : C.BORDER}`,
        padding: small ? '5px 12px' : '10px 20px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        fontWeight: 'bold',
        fontSize: small ? 12 : 13,
        letterSpacing: 1,
        boxShadow: pressed ? '1px 1px 0 #000' : '3px 3px 0 #000',
        transform: pressed ? 'translate(2px,2px)' : 'none',
        transition: 'box-shadow .05s, transform .05s',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
};

// ---- PAGE: Patients home grid -----------------------------------------------

const PatientsHome = ({ patients, onSelectPatient, onGoManage }) => {
  if (patients.length === 0) {
    return (
      <div style={S.centerBox}>
        <div style={{ fontSize: 56, marginBottom: 16, color: C.MUTED }}>[ ]</div>
        <h2 style={{ color: C.TEXT, margin: '0 0 8px', fontSize: 22 }}>Sem pacientes ainda</h2>
        <p style={{ color: C.MUTED, marginBottom: 28, fontSize: 14 }}>
          Adiciona o teu primeiro paciente pelo codigo de 6 digitos.
        </p>
        <PixelBtn onClick={onGoManage}>+ Adicionar Paciente</PixelBtn>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: C.TEXT, margin: '0 0 4px', fontSize: 22 }}>Os meus pacientes</h2>
        <p style={{ color: C.MUTED, margin: 0, fontSize: 13 }}>
          {patients.length} paciente{patients.length !== 1 ? 's' : ''} ativo{patients.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div style={S.patientGrid}>
        {patients.map(p => (
          <div
            key={p.id}
            style={S.patientCard}
            onClick={() => onSelectPatient(p)}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '6px 6px 0 #000'; e.currentTarget.style.transform = 'translate(-2px,-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '4px 4px 0 #000'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={S.avatarCircle}>{(p.first_name || p.username || '?').charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: C.TEXT, fontWeight: 'bold', fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.username}
              </div>
              <div style={{ color: C.BLUE, fontSize: 11, marginTop: 2 }}>#{p.patient_code}</div>
            </div>
            <Badge color={C.GOLD}>Nv {p.level}</Badge>

            <div style={{ width: '100%', borderTop: `1px solid ${C.INPUT}`, marginTop: 12, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: C.MUTED, fontSize: 12 }}>
                XP: <strong style={{ color: C.GOLD }}>{p.xp_total}</strong>
              </span>
              {p.weight_kg && <span style={{ color: C.MUTED, fontSize: 12 }}>{p.weight_kg} kg</span>}
              <span style={{ color: C.RED, fontSize: 12 }}>Ver perfil →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---- PAGE: Patient detail (tabs: Overview | Recipes) -----------------------

const EMPTY_FORM = { name: '', description: '', instructions: '', xp_reward: 50 };
const sortMeals  = (list) => [...list].sort((a, b) => {
  if (!a.meal_time && !b.meal_time) return 0;
  if (!a.meal_time) return 1;
  if (!b.meal_time) return -1;
  return a.meal_time.localeCompare(b.meal_time);
});
const EMPTY_ING  = { product_id: '', quantity: '', unit: 'g' };

// ── Pixel bar chart (no lib needed) ──────────────────────────────────────────
// ── Pixel bar chart ───────────────────────────────────────────────────────────
const PixelChart = ({ data, labelKey, valueKey, color, unit = '', height = 120 }) => {
  if (!data || data.length === 0) return <EmptyMsg>Sem dados suficientes ainda.</EmptyMsg>;
  const max = Math.max(...data.map(d => parseFloat(d[valueKey]) || 0), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height, paddingTop: 8 }}>
      {data.map((d, i) => {
        const val = parseFloat(d[valueKey]) || 0;
        const pct = val / max;
        const barH = Math.max(Math.round(pct * (height - 24)), 2);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ fontSize: 9, color: C.MUTED, whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%', textAlign: 'center' }}>
              {val > 0 ? `${Math.round(val)}${unit}` : ''}
            </div>
            <div style={{ width: '100%', height: barH, backgroundColor: color, border: `1px solid #000` }} title={`${d[labelKey]}: ${val}${unit}`} />
            <div style={{ fontSize: 9, color: C.MUTED, whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%', textAlign: 'center' }}>
              {String(d[labelKey]).slice(5)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Pixel line chart (SVG) ────────────────────────────────────────────────────
const PixelLineChart = ({ data, labelKey, valueKey, color, unit = '', height = 150 }) => {
  if (!data || data.length < 2) return <EmptyMsg>Sem dados suficientes ainda.</EmptyMsg>;

  const W = 100; // viewBox width (percentage-based)
  const H = height;
  const PAD = { top: 20, right: 8, bottom: 28, left: 40 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const vals  = data.map(d => parseFloat(d[valueKey]) || 0);
  const min   = Math.min(...vals);
  const max   = Math.max(...vals);
  const range = max - min || 1;

  const toX = (i) => PAD.left + (i / (data.length - 1)) * plotW;
  const toY = (v) => PAD.top + plotH - ((v - min) / range) * plotH;

  const points = data.map((d, i) => `${toX(i).toFixed(1)},${toY(parseFloat(d[valueKey]) || 0).toFixed(1)}`).join(' ');

  // Y-axis ticks (3 levels)
  const yTicks = [min, min + range / 2, max].map(v => Math.round(v * 10) / 10);

  // X-axis labels: show every ~4th or fewer to avoid clutter
  const step = Math.ceil(data.length / 5);

  return (
    <svg
      viewBox={`0 0 100 ${H}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: H, display: 'block', overflow: 'visible' }}
    >
      {/* Grid lines */}
      {yTicks.map((t, i) => (
        <line key={i}
          x1={PAD.left} y1={toY(t)}
          x2={PAD.left + plotW} y2={toY(t)}
          stroke={C.INPUT} strokeWidth="0.5" strokeDasharray="2,2"
        />
      ))}

      {/* Y-axis labels */}
      {yTicks.map((t, i) => (
        <text key={i} x={PAD.left - 2} y={toY(t) + 1.5}
          textAnchor="end" fontSize="4.5" fill={C.MUTED}>
          {t}{unit}
        </text>
      ))}

      {/* X-axis labels */}
      {data.map((d, i) => i % step === 0 && (
        <text key={i} x={toX(i)} y={H - PAD.bottom + 8}
          textAnchor="middle" fontSize="4" fill={C.MUTED}>
          {String(d[labelKey]).slice(5)}
        </text>
      ))}

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Area fill */}
      <polygon
        points={`${toX(0).toFixed(1)},${(PAD.top + plotH).toFixed(1)} ${points} ${toX(data.length - 1).toFixed(1)},${(PAD.top + plotH).toFixed(1)}`}
        fill={color}
        opacity="0.12"
      />

      {/* Data points */}
      {data.map((d, i) => (
        <circle key={i}
          cx={toX(i)} cy={toY(parseFloat(d[valueKey]) || 0)}
          r="1.8" fill={color} stroke="#fff" strokeWidth="0.8"
        >
          <title>{String(d[labelKey]).slice(5)}: {parseFloat(d[valueKey]).toFixed(1)}{unit}</title>
        </circle>
      ))}
    </svg>
  );
};

const ChartCard = ({ title, color, children }) => (
  <div style={{ backgroundColor: C.CARD, border: `2px solid ${C.BORDER}`, padding: '16px 20px', marginBottom: 16, borderTop: `3px solid ${color}` }}>
    <div style={{ color: color, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>{title}</div>
    {children}
  </div>
);

const PatientDetail = ({ patient, token, onBack }) => {
  const [tab,            setTab]           = useState(0);
  const [xpHistory,      setXpHistory]     = useState([]);
  const [recipes,        setRecipes]       = useState([]);
  const [library,        setLibrary]       = useState([]);
  const [dashboard,      setDashboard]     = useState(null);
  const [selectedRecipe, setSelectedRecipe]= useState('');
  const [assigning,      setAssigning]     = useState(false);
  const [msg,            setMsg]           = useState('');

  // Meal plan state
  const [meals,        setMeals]        = useState([]);
  const [newMealName,  setNewMealName]  = useState('');
  const [newMealTime,  setNewMealTime]  = useState('');
  const [mealMsg,      setMealMsg]      = useState('');
  const [newItems,     setNewItems]     = useState({}); // { mealId: '' }
  const [recipeSearch, setRecipeSearch] = useState('');

  const load = useCallback(async () => {
    const [xpRes, recRes, libRes, dashRes, planRes] = await Promise.all([
      apiFetch(`${API}/api/admin/patients/${patient.id}/xp`,        { headers: authH(token) }),
      apiFetch(`${API}/api/recipes/for-patient/${patient.id}`,      { headers: authH(token) }),
      apiFetch(`${API}/api/recipes/library`,                        { headers: authH(token) }),
      apiFetch(`${API}/api/admin/patients/${patient.id}/dashboard`, { headers: authH(token) }),
      apiFetch(`${API}/api/meal-plan/for-patient/${patient.id}`,    { headers: authH(token) }),
    ]);
    const [xp, rec, lib, dash, plan] = await Promise.all([
      xpRes.json(), recRes.json(), libRes.json(), dashRes.json(), planRes.json(),
    ]);
    setXpHistory(Array.isArray(xp)   ? xp   : []);
    setRecipes(  Array.isArray(rec)  ? rec  : []);
    setLibrary(  Array.isArray(lib)  ? lib  : []);
    setDashboard(dash && !dash.error ? dash : null);
    setMeals(    Array.isArray(plan) ? sortMeals(plan) : []);
  }, [patient.id, token]);

  useEffect(() => { load(); }, [load]);

  const assignRecipe = async () => {
    if (!selectedRecipe) return;
    setAssigning(true); setMsg('');
    try {
      const res = await apiFetch(`${API}/api/recipes/assign`, {
        method: 'POST', headers: authH(token),
        body: JSON.stringify({ recipe_id: selectedRecipe, patient_id: patient.id }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setSelectedRecipe('');
      setMsg('Receita atribuída com sucesso!');
      load();
    } catch (err) { setMsg(`Erro: ${err.message}`); }
    finally { setAssigning(false); }
  };

  const removeAssignment = async (assignmentId) => {
    if (!window.confirm('Remover esta receita do paciente?')) return;
    await apiFetch(`${API}/api/recipes/assign/${assignmentId}`, { method: 'DELETE', headers: authH(token) });
    load();
  };

  // recipes already assigned to this patient (by id)
  const assignedIds = new Set(recipes.map(r => r.id));
  // library recipes not yet assigned
  const available = library.filter(r => !assignedIds.has(r.id));
  const filteredRecipes = filterRecipes(recipes, recipeSearch);

  // ── Meal Plan CRUD ──────────────────────────────────────────────────────────
  const addMeal = async (e) => {
    e.preventDefault();
    if (!newMealName.trim() || !newMealTime) return;
    setMealMsg('');
    try {
      const res = await apiFetch(`${API}/api/meal-plan/for-patient/${patient.id}/meal`, {
        method: 'POST', headers: authH(token),
        body: JSON.stringify({ name: newMealName.trim(), meal_time: newMealTime, order_index: meals.length }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const newMeal = await res.json();
      setMeals(prev => sortMeals([...prev, { ...newMeal, items: [] }]));
      setNewMealName(''); setNewMealTime('');
    } catch (err) { setMealMsg(`Erro: ${err.message}`); }
  };

  const deleteMeal = async (mealId) => {
    if (!window.confirm('Eliminar esta refeição e todos os seus itens?')) return;
    await apiFetch(`${API}/api/meal-plan/meal/${mealId}`, { method: 'DELETE', headers: authH(token) });
    setMeals(prev => sortMeals(prev.filter(m => m.id !== mealId)));
  };

  const addItem = async (mealId) => {
    const desc = (newItems[mealId] || '').trim();
    if (!desc) return;
    const res = await apiFetch(`${API}/api/meal-plan/meal/${mealId}/item`, {
      method: 'POST', headers: authH(token),
      body: JSON.stringify({ description: desc }),
    });
    if (res.ok) {
      setNewItems(prev => ({ ...prev, [mealId]: '' }));
      load();
    }
  };

  const deleteItem = async (itemId) => {
    await apiFetch(`${API}/api/meal-plan/item/${itemId}`, { method: 'DELETE', headers: authH(token) });
    load();
  };

  const TABS = ['Dashboard', 'Plano Nutricional', 'Receitas', 'Historico XP'];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={S.avatarCircleLg}>{(patient.first_name || patient.username || '?').charAt(0).toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <h2 style={{ color: C.TEXT, margin: 0, fontSize: 20 }}>
            {patient.first_name && patient.last_name ? `${patient.first_name} ${patient.last_name}` : patient.username}
          </h2>
          <span style={{ color: C.BLUE, fontSize: 12 }}>#{patient.patient_code}</span>
        </div>
        <PixelBtn onClick={onBack} outline small>← Voltar</PixelBtn>
      </div>

      {/* Stats row */}
      <div style={S.statsRow}>
        {[
          { label: 'Nível',     value: patient.level,                                          color: C.RED },
          { label: 'XP Total',  value: patient.xp_total,                                       color: C.GOLD },
          { label: 'Peso',      value: patient.weight_kg ? `${patient.weight_kg} kg` : '—',    color: C.BLUE },
          { label: 'Receitas',  value: recipes.length,                                          color: C.PURPLE },
          { label: 'Média H₂O', value: dashboard ? `${dashboard.avgWater} ml` : '—',           color: C.CYAN || '#0891b2' },
          { label: 'Concluídas',value: dashboard ? dashboard.completions.length : '—',         color: C.GREEN },
        ].map(s => (
          <div key={s.label} style={{ ...S.statCard, borderTopColor: s.color }}>
            <div style={{ color: s.color, fontSize: 22, fontWeight: 'bold' }}>{s.value}</div>
            <div style={{ color: C.MUTED, fontSize: 11, marginTop: 4, letterSpacing: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={S.tabBar}>
        {TABS.map((t, i) => (
          <button key={t} style={{ ...S.tab, ...(tab === i ? S.tabActive : {}) }} onClick={() => setTab(i)}>
            {t}
            {i === 2 && recipes.length > 0 && <span style={S.tabBadge}>{recipes.length}</span>}
            {i === 1 && meals.length > 0 && <span style={S.tabBadge}>{meals.length}</span>}
          </button>
        ))}
      </div>

      {/* ── Tab 0: Dashboard ── */}
      {tab === 0 && (

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>

          <ChartCard title="Água consumida — últimos 14 dias (ml)" color={C.BLUE}>
            <PixelChart
              data={dashboard?.hydration ?? []}
              labelKey="day" valueKey="total_ml"
              color={C.BLUE} unit="ml" height={140}
            />
          </ChartCard>

          <ChartCard title="XP ganho — últimos 14 dias" color={C.GOLD}>
            <PixelChart
              data={dashboard?.xpDaily ?? []}
              labelKey="day" valueKey="total_xp"
              color={C.GOLD} unit=" xp" height={140}
            />
          </ChartCard>

          <ChartCard title="Progressão de peso (kg)" color={C.GREEN}>
            {dashboard?.weightHistory?.length > 0 ? (
              <PixelChart
                data={dashboard.weightHistory.map(w => ({ day: w.logged_at?.slice(0, 10), total: w.weight_kg }))}
                labelKey="day" valueKey="total"
                color={C.GREEN} unit=" kg" height={140}
              />
            ) : (
              <EmptyMsg>Sem registos de peso ainda. O paciente deve actualizar o peso na app.</EmptyMsg>
            )}
          </ChartCard>

          <ChartCard title="Receitas concluídas" color={C.PURPLE}>
            {dashboard?.completions?.length > 0 ? (
              <div>
                {dashboard.completions.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.INPUT}` }}>
                    <span style={{ color: C.TEXT, fontSize: 13 }}>{c.name}</span>
                    <span style={{ color: C.GOLD, fontSize: 12 }}>+{c.xp_reward} XP · {c.completed_at?.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyMsg>Nenhuma receita concluída ainda.</EmptyMsg>
            )}
          </ChartCard>
        </div>
      )}

      {/* ── Tab 1: Plano Nutricional ── */}
      {tab === 1 && (
        <div>
          {/* Add meal form */}
          <form onSubmit={addMeal} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 24 }}>
            <div style={{ flex: 2, minWidth: 160 }}>
              <label style={S.label}>Nome da Refeição *</label>
              <input style={{ ...S.input, marginBottom: 0 }} placeholder="ex: Pequeno Almoço" value={newMealName} onChange={e => setNewMealName(e.target.value)} required />
            </div>
            <div style={{ flex: 1, minWidth: 100 }}>
              <label style={S.label}>Horário *</label>
              <input style={{ ...S.input, marginBottom: 0 }} type="time" value={newMealTime} onChange={e => setNewMealTime(e.target.value)} required />
            </div>
            <PixelBtn type="submit" style={{ height: 40 }}>+ Refeição</PixelBtn>
          </form>
          {mealMsg && <p style={{ color: C.RED, fontSize: 13, marginBottom: 12 }}>{mealMsg}</p>}

          {meals.length === 0 && (
            <div style={{ ...S.formCard, borderLeft: `4px solid ${C.GOLD}`, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.GOLD, fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>Começar com template base</div>
                <div style={{ color: C.MUTED, fontSize: 12, lineHeight: 1.6 }}>
                  Cria automaticamente: Pequeno Almoço (08h), Lanche da Manhã (11h), Almoço (12h), Lanche da Tarde (16h) e Jantar (20h) com itens predefinidos.
                </div>
              </div>
              <PixelBtn color={C.GOLD} onClick={async () => {
                setMealMsg('');
                try {
                  const res = await apiFetch(`${API}/api/meal-plan/for-patient/${patient.id}/template`, { method: 'POST', headers: authH(token) });
                  if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
                  const plan = await res.json();
                  setMeals(sortMeals(plan));
                } catch (err) { setMealMsg(`Erro: ${err.message}`); }
              }}>Usar Template</PixelBtn>
            </div>
          )}

          {meals.length === 0
            ? <EmptyMsg>Ainda não há refeições no plano. Adiciona acima ou usa o template.</EmptyMsg>
            : meals.map((meal) => (
              <div key={meal.id} style={{ ...S.formCard, marginBottom: 16, borderLeft: `4px solid ${C.GREEN}` }}>
                {/* Meal header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {meal.meal_time && (
                      <Badge color={C.BLUE}>{meal.meal_time}</Badge>
                    )}
                    <span style={{ color: C.GREEN, fontWeight: 'bold', fontSize: 15, letterSpacing: 1 }}>{meal.name}</span>
  
                  </div>
                  <button onClick={() => deleteMeal(meal.id)}
                    style={{ background: 'none', border: 'none', color: C.MUTED, cursor: 'pointer', fontSize: 18 }}>x</button>
                </div>

                {/* Items list */}
                {meal.items?.length > 0 && (
                  <ul style={{ margin: '0 0 12px', paddingLeft: 20 }}>
                    {meal.items.map(item => (
                      <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ color: C.TEXT, fontSize: 13 }}>{item.description}</span>
                        <button onClick={() => deleteItem(item.id)}
                          style={{ background: 'none', border: 'none', color: C.MUTED, cursor: 'pointer', fontSize: 16, marginLeft: 8, flexShrink: 0 }}>×</button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Add item row */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    style={{ ...S.input, flex: 1, marginBottom: 0, fontSize: 13 }}
                    placeholder='ex: "2 ovos mexidos"'
                    value={newItems[meal.id] || ''}
                    onChange={e => setNewItems(prev => ({ ...prev, [meal.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem(meal.id))}
                  />
                  <PixelBtn small onClick={() => addItem(meal.id)}>+ Item</PixelBtn>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* ── Tab 2: Receitas ── */}
      {tab === 2 && (
        <div>
          {/* Assign from library */}
          <div style={{ ...S.formCard, marginBottom: 24 }}>
            <h4 style={{ color: C.GOLD, marginTop: 0, marginBottom: 12, letterSpacing: 1 }}>Atribuir Receita</h4>
            {available.length === 0 ? (
              <p style={{ color: C.MUTED, fontSize: 13 }}>
                {library.length === 0
                  ? 'Ainda não tens receitas na biblioteca. Vai a "Receitas" para criar.'
                  : 'Todas as receitas da biblioteca já foram atribuídas a este paciente.'}
              </p>
            ) : (
              <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
                <select
                  style={{ ...S.input, flex: 1, marginBottom: 0 }}
                  value={selectedRecipe}
                  onChange={e => setSelectedRecipe(e.target.value)}
                >
                  <option value="">Selecionar receita da biblioteca...</option>
                  {available.map(r => (
                    <option key={r.id} value={r.id}>{r.name} (+{r.xp_reward} XP)</option>
                  ))}
                </select>
                <PixelBtn
                  disabled={!selectedRecipe || assigning}
                  onClick={assignRecipe}
                  style={{
                    width: 'auto',
                    padding: '0 20px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {assigning ? '...' : 'Atribuir'}
                </PixelBtn>
              </div>
            )}
            {msg && <p style={{ color: msg.startsWith('Erro') ? C.RED : C.GREEN, marginTop: 10, fontSize: 13 }}>{msg}</p>}
          </div>

          {/* Assigned recipes list */}
          <h3 style={{ ...S.sectionTitle, marginBottom: 16 }}>Receitas atribuídas ({recipes.length})</h3>
          {recipes.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <RecipeSearchInput value={recipeSearch} onChange={setRecipeSearch} />
            </div>
          )}
          {recipes.length === 0
            ? <EmptyMsg>Nenhuma receita atribuída ainda. Usa o selector acima.</EmptyMsg>
            : filteredRecipes.length === 0
              ? <EmptyMsg>Nenhuma receita encontrada para &quot;{recipeSearch}&quot;.</EmptyMsg>
              : filteredRecipes.map(r => (
                <RecipeAccordion
                  key={r.assignment_id || r.id}
                  recipe={r}
                  onDelete={() => removeAssignment(r.assignment_id)}
                  deleteTitle="Remover atribuição"
                />
              ))
          }
        </div>
      )}

      {/* ── Tab 3: Histórico XP ── */}
      {tab === 3 && (
        <div>
          <h3 style={S.sectionTitle}>Histórico de XP</h3>
          {xpHistory.length === 0
            ? <EmptyMsg>Sem actividade registada.</EmptyMsg>
            : (
              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Ação</th>
                      <th style={S.th}>Descrição</th>
                      <th style={S.th}>XP</th>
                      <th style={S.th}>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {xpHistory.map(log => (
                      <tr key={log.id}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.CARD}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={S.td}>{log.action}</td>
                        <td style={{ ...S.td, color: C.MUTED }}>{log.description || '—'}</td>
                        <td style={{ ...S.td, color: C.GREEN, fontWeight: 'bold' }}>+{log.xp_gained}</td>
                        <td style={{ ...S.td, color: C.MUTED }}>{new Date(log.logged_at).toLocaleString('pt-PT')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}
    </div>
  );
};

// ---- PAGE: Manage patients --------------------------------------------------

const ManagePatients = ({ token, patients, onRefresh, onViewPatient }) => {
  const [codeInput,  setCodeInput]  = useState('');
  const [addError,   setAddError]   = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [adding,     setAdding]     = useState(false);

  const addPatient = async (e) => {
    e.preventDefault();
    setAddError(''); setAddSuccess('');
    if (codeInput.length !== 6) return setAddError('O codigo deve ter exatamente 6 digitos.');
    setAdding(true);
    try {
      const res = await apiFetch(`${API}/api/admin/patients/add`, {
        method: 'POST', headers: authH(token),
        body: JSON.stringify({ code: codeInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAddSuccess(`Paciente ${data.patient.first_name} ${data.patient.last_name} adicionado!`);
      setCodeInput('');
      onRefresh();
    } catch (err) { setAddError(err.message); }
    finally { setAdding(false); }
  };

  const removePatient = async (p) => {
    if (!window.confirm(`Remover ${p.username} da tua lista?`)) return;
    await apiFetch(`${API}/api/admin/patients/${p.id}`, { method: 'DELETE', headers: authH(token) });
    onRefresh();
  };

  return (
    <div>
      <h2 style={{ color: C.TEXT, marginTop: 0, marginBottom: 4, fontSize: 22 }}>Gestao de Pacientes</h2>
      <p style={{ color: C.MUTED, marginBottom: 28 }}>Adiciona ou remove pacientes da tua lista.</p>

      <div style={S.formCard}>
        <h3 style={{ color: C.GOLD, marginTop: 0, marginBottom: 12, letterSpacing: 1 }}>Adicionar por Codigo</h3>
        <p style={{ color: C.MUTED, fontSize: 13, marginBottom: 14, lineHeight: 1.6 }}>
          O paciente encontra o seu codigo de 6 digitos no perfil da app movel.
        </p>
        <form onSubmit={addPatient} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <input
            style={{ ...S.input, width: 160, letterSpacing: 8, textAlign: 'center', marginBottom: 0, fontSize: 20 }}
            type="text" maxLength={6} placeholder="000000"
            value={codeInput} onChange={e => setCodeInput(e.target.value.replace(/\D/g, ''))}
          />
          <PixelBtn type="submit" disabled={adding}>
            {adding ? 'A adicionar...' : '+ Adicionar'}
          </PixelBtn>
        </form>
        {addError   && <p style={{ color: C.RED,   fontSize: 13, marginTop: 10 }}>{addError}</p>}
        {addSuccess && <p style={{ color: C.GREEN, fontSize: 13, marginTop: 10 }}>{addSuccess}</p>}
      </div>

      <h3 style={{ ...S.sectionTitle, marginTop: 28 }}>Pacientes ({patients.length})</h3>
      {patients.length === 0
        ? <EmptyMsg>Nenhum paciente adicionado ainda.</EmptyMsg>
        : patients.map(p => (
          <div
            key={p.id}
            style={{ ...S.manageRow, cursor: 'pointer' }}
            onClick={() => onViewPatient(p)}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '6px 6px 0 #000'; e.currentTarget.style.transform = 'translate(-2px,-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '4px 4px 0 #000'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={S.avatarCircle}>
              {(p.first_name || p.username || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.TEXT, fontWeight: 'bold', fontSize: 15 }}>
                {p.first_name && p.last_name
                  ? `${p.first_name.charAt(0).toUpperCase()}${p.first_name.slice(1).toLowerCase()} ${p.last_name.charAt(0).toUpperCase()}${p.last_name.slice(1).toLowerCase()}`
                  : p.username}
              </div>
              <div style={{ color: C.BLUE, fontSize: 11, marginTop: 2 }}>#{p.patient_code}</div>
              {p.email && <div style={{ color: C.MUTED, fontSize: 11, marginTop: 1 }}>{p.email}</div>}
            </div>
            <Badge color={C.GOLD}>Nv {p.level}</Badge>
            <PixelBtn small onClick={e => { e.stopPropagation(); onViewPatient(p); }}>Ver Perfil</PixelBtn>
            <PixelBtn small color={C.RED} onClick={e => { e.stopPropagation(); removePatient(p); }}>Remover</PixelBtn>
          </div>
        ))
      }
    </div>
  );
};

// ---- PAGE: Products catalog -------------------------------------------------

const ProductsCatalog = ({ token }) => {
  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [form,        setForm]        = useState({
    name: '', description: '', unit: 'g', category: '', low_stock_threshold: '1',
  });
  const [showForm,    setShowForm]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState('');
  const [search,      setSearch]      = useState('');
  const [newCatName,  setNewCatName]  = useState('');
  const [catMsg,      setCatMsg]      = useState('');
  const [showCatForm, setShowCatForm] = useState(false);

  const loadProducts = useCallback(async () => {
    const res = await apiFetch(`${API}/api/products`, { headers: authH(token) });
    const d = await res.json();
    setProducts(Array.isArray(d) ? d : []);
  }, [token]);

  const loadCategories = useCallback(async () => {
    const res = await apiFetch(`${API}/api/categories`, { headers: authH(token) });
    const d = await res.json();
    setCategories(Array.isArray(d) ? d : []);
  }, [token]);

  useEffect(() => { loadProducts(); loadCategories(); }, [loadProducts, loadCategories]);

  const setF = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.unit) return setMsg('Nome e unidade são obrigatórios.');
    const threshold = parseFloat(form.low_stock_threshold);
    if (!Number.isFinite(threshold) || threshold <= 0) {
      return setMsg('Stock mínimo inválido (número positivo).');
    }
    setSaving(true); setMsg('');
    try {
      const res = await apiFetch(`${API}/api/products`, {
        method: 'POST',
        headers: authH(token),
        body: JSON.stringify({ ...form, low_stock_threshold: threshold }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setMsg('Ingrediente adicionado!');
      setForm({ name: '', description: '', unit: 'g', category: '', low_stock_threshold: '1' });
      setShowForm(false);
      loadProducts();
    } catch (err) { setMsg(`Erro: ${err.message}`); }
    finally { setSaving(false); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Eliminar este ingrediente do catálogo?')) return;
    await apiFetch(`${API}/api/products/${id}`, { method: 'DELETE', headers: authH(token) });
    loadProducts();
  };

  const createCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatMsg('');
    try {
      const res = await apiFetch(`${API}/api/categories`, {
        method: 'POST', headers: authH(token), body: JSON.stringify({ name: newCatName.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setNewCatName('');
      setCatMsg('Categoria criada!');
      setShowCatForm(false);
      loadCategories();
    } catch (err) { setCatMsg(`Erro: ${err.message}`); }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Eliminar esta categoria?')) return;
    await apiFetch(`${API}/api/categories/${id}`, { method: 'DELETE', headers: authH(token) });
    loadCategories();
    loadProducts();
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
  );
  const grouped = filtered.reduce((acc, p) => {
    const cat = p.category || 'Outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div>
          <h2 style={{ color: C.TEXT, margin: 0, fontSize: 22 }}>Catálogo de Ingredientes</h2>
          <p style={{ color: C.MUTED, margin: '4px 0 0', fontSize: 13 }}>{products.length} ingrediente{products.length !== 1 ? 's' : ''} disponíve{products.length !== 1 ? 'is' : 'l'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <PixelBtn color={C.BLUE} onClick={() => { setShowCatForm(v => !v); setCatMsg(''); }}>
            {showCatForm ? 'Fechar' : '+ Categoria'}
          </PixelBtn>
          <PixelBtn onClick={() => { setShowForm(v => !v); setMsg(''); }}>
            {showForm ? 'Cancelar' : '+ Novo Ingrediente'}
          </PixelBtn>
        </div>
      </div>

      {/* ── Criar Categoria ── */}
      {showCatForm && (
        <div style={{ ...S.formCard, marginTop: 16 }}>
          <h4 style={{ color: C.BLUE, marginTop: 0, letterSpacing: 1 }}>Gerir Categorias</h4>
          <form onSubmit={createCategory} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input
              style={{ ...S.input, flex: 1, margin: 0 }}
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="Nome da nova categoria..."
              required
            />
            <PixelBtn type="submit" color={C.BLUE} style={{ width: 'auto', padding: '0 20px' }}>
              Criar
            </PixelBtn>
          </form>
          {catMsg && <p style={{ color: catMsg.startsWith('Erro') ? C.RED : C.GREEN, fontSize: 13, margin: '0 0 12px' }}>{catMsg}</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {categories.map(cat => (
              <div key={cat.id} style={{ ...S.productTag, borderColor: C.BLUE }}>
                <span style={{ color: C.TEXT }}>{cat.name}</span>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  style={{ background: 'none', border: 'none', color: C.MUTED, cursor: 'pointer', fontSize: 12, marginLeft: 6 }}>x
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {msg && <p style={{ color: msg.startsWith('Erro') ? C.RED : C.GREEN, marginTop: 12, fontSize: 13 }}>{msg}</p>}

      {/* ── Novo Ingrediente ── */}
      {showForm && (
        <form onSubmit={submit} style={{ ...S.formCard, marginTop: 16 }}>
          <h4 style={{ color: C.GOLD, marginTop: 0, letterSpacing: 1 }}>Novo Ingrediente</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={S.label}>Nome *</label>
              <input style={S.input} value={form.name} onChange={setF('name')} placeholder="ex: Quinoa" required />
            </div>
            <div>
              <label style={S.label}>Unidade *</label>
              <select style={S.input} value={form.unit} onChange={setF('unit')}>
                {['g', 'kg', 'ml', 'l', 'un'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Stock mínimo *</label>
              <input
                style={S.input}
                type="number"
                min="0.01"
                step="any"
                value={form.low_stock_threshold}
                onChange={setF('low_stock_threshold')}
                placeholder="ex: 1"
                required
              />
            </div>
            <div>
              <label style={S.label}>Categoria</label>
              <select style={S.input} value={form.category} onChange={setF('category')}>
                <option value="">-- Sem categoria --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <p style={{ color: C.MUTED, fontSize: 12, margin: '0 0 12px' }}>
            Stock mínimo: quantidade abaixo da qual o paciente recebe alerta na dispensa (na mesma unidade).
          </p>
          <label style={S.label}>Descricão</label>
          <input style={S.input} value={form.description} onChange={setF('description')} placeholder="Breve descrição (opcional)" />
          <PixelBtn type="submit" disabled={saving}>
            {saving ? 'A guardar...' : 'Adicionar Ingrediente'}
          </PixelBtn>
        </form>
      )}

      {/* ── Pesquisa ── */}
      <input
        style={{ ...S.input, marginTop: 20, marginBottom: 20 }}
        placeholder="Pesquisar ingrediente ou categoria..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* ── Lista agrupada ── */}
      {Object.keys(grouped).sort().map(cat => (
        <div key={cat} style={{ marginBottom: 24 }}>
          <div style={{ color: C.BLUE, fontSize: 11, letterSpacing: 2, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10, textTransform: 'uppercase' }}>
            <span>{cat}</span>
            <span style={{ flex: 1, borderTop: `1px solid ${C.INPUT}` }} />
            <span style={{ color: C.MUTED }}>{grouped[cat].length}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {grouped[cat].map(p => (
              <div key={p.id} style={S.productTag}>
                <span style={{ color: C.TEXT }}>{p.name}</span>
                <span style={{ color: C.MUTED, fontSize: 11 }}>({p.unit})</span>
                <button
                  onClick={() => deleteProduct(p.id)} title="Eliminar"
                  style={{ background: 'none', border: 'none', color: C.MUTED, cursor: 'pointer', fontSize: 12, marginLeft: 4 }}>x
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ---- PAGE: Change password --------------------------------------------------

const ChangePassword = ({ token }) => {
  const [form,    setForm]    = useState({ current: '', next: '', confirm: '' });
  const [msg,     setMsg]     = useState('');
  const [isError, setIsError] = useState(false);
  const [saving,  setSaving]  = useState(false);

  const setF = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg(''); setIsError(false);
    if (form.next !== form.confirm) {
      setIsError(true); return setMsg('As senhas nao coincidem.');
    }
    if (form.next.length < 6) {
      setIsError(true); return setMsg('A nova senha deve ter pelo menos 6 caracteres.');
    }
    setSaving(true);
    try {
      const res = await apiFetch(`${API}/api/user/change-password`, {
        method: 'POST',
        headers: authH(token),
        body: JSON.stringify({ current_password: form.current, new_password: form.next }),
      });
      const data = await res.json();
      if (!res.ok) { setIsError(true); throw new Error(data.error); }
      setMsg('Senha alterada com sucesso!');
      setForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setIsError(true);
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: 'current', label: 'Senha Atual',        type: 'password', placeholder: 'A tua senha atual' },
    { key: 'next',    label: 'Nova Senha',          type: 'password', placeholder: 'Minimo 6 caracteres' },
    { key: 'confirm', label: 'Confirmar Nova Senha', type: 'password', placeholder: 'Repete a nova senha' },
  ];

  return (
    <div>
      <h2 style={{ color: C.TEXT, marginTop: 0, marginBottom: 4, fontSize: 22 }}>Alterar Senha</h2>
      <p style={{ color: C.MUTED, marginBottom: 28, fontSize: 13 }}>
        Escolhe uma nova senha para a tua conta.
      </p>

      <div style={S.formCard}>
        {msg && (
          <div style={{
            backgroundColor: isError ? '#fee2e2' : '#dcfce7',
            border: `2px solid ${isError ? C.RED : C.GREEN}`,
            color: isError ? C.RED : C.GREEN,
            padding: '10px 14px', fontSize: 13, marginBottom: 16,
          }}>
            {msg}
          </div>
        )}

        <form onSubmit={submit}>
          {fields.map(f => (
            <div key={f.key}>
              <label style={S.label}>{f.label}</label>
              <input
                style={S.input}
                type={f.type}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={setF(f.key)}
                required
              />
            </div>
          ))}
          <PixelBtn type="submit" disabled={saving} style={{ width: '100%', marginTop: 4 }}>
            {saving ? 'A guardar...' : 'Alterar Senha'}
          </PixelBtn>
        </form>
      </div>
    </div>
  );
};

// ---- Root Dashboard layout --------------------------------------------------

// ---- PAGE: Recipes Library --------------------------------------------------

const RecipesLibrary = ({ token }) => {
  const [recipes,  setRecipes]  = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [ings,     setIngs]     = useState([{ ...EMPTY_ING }]);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');
  const [search,   setSearch]   = useState('');

  const load = useCallback(async () => {
    const [rRes, pRes] = await Promise.all([
      apiFetch(`${API}/api/recipes/library`, { headers: authH(token) }),
      apiFetch(`${API}/api/products`,        { headers: authH(token) }),
    ]);
    const [r, p] = await Promise.all([rRes.json(), pRes.json()]);
    setRecipes( Array.isArray(r) ? r : []);
    setProducts(Array.isArray(p) ? p : []);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const setF = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const updateIng = (i, key, val) =>
    setIngs(prev => prev.map((row, idx) => idx === i ? { ...row, [key]: val } : row));
  const pickProduct = (i, pid) => {
    const p = products.find(pr => pr.id === pid);
    setIngs(prev => prev.map((row, idx) =>
      idx === i ? { ...row, product_id: pid, unit: p?.unit ?? row.unit } : row
    ));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name) return setMsg('Nome é obrigatório.');
    setSaving(true); setMsg('');
    try {
      const res = await apiFetch(`${API}/api/recipes/library`, {
        method: 'POST', headers: authH(token),
        body: JSON.stringify({
          ...form,
          xp_reward: parseInt(form.xp_reward) || 50,
          ingredients: ings.filter(i => i.product_id && i.quantity)
            .map(i => ({ product_id: i.product_id, quantity: parseFloat(i.quantity), unit: i.unit })),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setMsg('Receita criada!');
      setForm(EMPTY_FORM); setIngs([{ ...EMPTY_ING }]); setShowForm(false);
      load();
    } catch (err) { setMsg(`Erro: ${err.message}`); }
    finally { setSaving(false); }
  };

  const deleteRecipe = async (id) => {
    if (!window.confirm('Eliminar esta receita da biblioteca?')) return;
    await apiFetch(`${API}/api/recipes/library/${id}`, { method: 'DELETE', headers: authH(token) });
    load();
  };

  const categories = Array.from(new Set(products.map(p => p.category))).sort();
  const filtered = filterRecipes(recipes, search);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div>
          <h2 style={{ color: C.TEXT, margin: 0, fontSize: 22 }}>Biblioteca de Receitas</h2>
          <p style={{ color: C.MUTED, margin: '4px 0 0', fontSize: 13 }}>{recipes.length} receita{recipes.length !== 1 ? 's' : ''} criada{recipes.length !== 1 ? 's' : ''}</p>
        </div>
        <PixelBtn onClick={() => { setShowForm(v => !v); setMsg(''); }}>
          {showForm ? 'Cancelar' : '+ Nova Receita'}
        </PixelBtn>
      </div>

      {msg && <p style={{ color: msg.startsWith('Erro') ? C.RED : C.GREEN, marginTop: 12, fontSize: 13 }}>{msg}</p>}

      {showForm && (
        <form onSubmit={submit} style={{ ...S.formCard, marginTop: 20 }}>
          <h4 style={{ color: C.GOLD, marginTop: 0, marginBottom: 16, letterSpacing: 1 }}>Nova Receita</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
            <div>
              <label style={S.label}>Nome *</label>
              <input style={S.input} value={form.name} onChange={setF('name')} placeholder="ex: Omelete de espinafre" required />
            </div>
            <div>
              <label style={S.label}>XP</label>
              <input style={S.input} type="number" min={0} value={form.xp_reward} onChange={setF('xp_reward')} />
            </div>
          </div>
          <label style={S.label}>Descrição</label>
          <textarea style={{ ...S.input, minHeight: 56, resize: 'vertical' }} value={form.description} onChange={setF('description')} placeholder="Breve descrição" />
          <label style={S.label}>Instruções</label>
          <textarea style={{ ...S.input, minHeight: 80, resize: 'vertical' }} value={form.instructions} onChange={setF('instructions')} placeholder="Passo a passo..." />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 10px' }}>
            <h4 style={{ color: C.BLUE, margin: 0, letterSpacing: 1 }}>Ingredientes</h4>
            <PixelBtn small color={C.BLUE} onClick={() => setIngs(p => [...p, { ...EMPTY_ING }])}>+ Adicionar</PixelBtn>
          </div>
          {ings.map((ing, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <select style={{ ...S.input, flex: 3, marginBottom: 0 }} value={ing.product_id} onChange={e => pickProduct(i, e.target.value)}>
                <option value="">Selecionar ingrediente...</option>
                {categories.map(cat => (
                  <optgroup key={cat || 'Outros'} label={cat || 'Outros'}>
                    {products.filter(p => p.category === cat).map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <input style={{ ...S.input, width: 80, marginBottom: 0 }} type="number" min={0} step="0.1" placeholder="Qtd" value={ing.quantity} onChange={e => updateIng(i, 'quantity', e.target.value)} />
              <select style={{ ...S.input, width: 68, marginBottom: 0 }} value={ing.unit} onChange={e => updateIng(i, 'unit', e.target.value)}>
                {['g', 'kg', 'ml', 'l', 'un'].map(u => <option key={u}>{u}</option>)}
              </select>
              {ings.length > 1 && (
                <button type="button" onClick={() => setIngs(p => p.filter((_, idx) => idx !== i))}
                  style={{ background: 'none', border: 'none', color: C.RED, cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>x</button>
              )}
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <PixelBtn type="submit" disabled={saving} style={{ width: '100%' }}>
              {saving ? 'A guardar...' : 'Guardar Receita'}
            </PixelBtn>
          </div>
        </form>
      )}

      <div style={{ marginTop: 24 }}>
        {recipes.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <RecipeSearchInput value={search} onChange={setSearch} />
          </div>
        )}
        {recipes.length === 0
          ? <EmptyMsg>Ainda não criaste receitas. Cria a primeira acima.</EmptyMsg>
          : filtered.length === 0
            ? <EmptyMsg>Nenhuma receita encontrada para &quot;{search}&quot;.</EmptyMsg>
            : filtered.map(r => (
              <RecipeAccordion
                key={r.id}
                recipe={r}
                onDelete={() => deleteRecipe(r.id)}
              />
            ))
        }
      </div>
    </div>
  );
};

const NAV = [
  { id: 'patients', label: 'Pacientes' },
  { id: 'recipes',  label: 'Receitas' },
  { id: 'products', label: 'Ingredientes' },
  { id: 'manage',   label: 'Gerir Pacientes' },
];

const ADMIN_NAV = [
  { id: 'admin-home',  label: 'Início' },
  { id: 'admin-users', label: 'Utilizadores' },
];

const Dashboard = ({ token, onLogout }) => {
  const [navItem,  setNavItem]  = useState('patients');
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileReady, setProfileReady] = useState(false);

  const fetchProfile = useCallback(async () => {
    const res = await apiFetch(`${API}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      setNavItem(data.role === 'admin' ? 'admin-home' : 'patients');
    }
    setProfileReady(true);
  }, [token]);

  const isAdmin = profile?.role === 'admin';
  const navItems = isAdmin ? ADMIN_NAV : NAV;

  const fetchPatients = useCallback(async () => {
    if (profile?.role === 'admin') return;
    const res = await apiFetch(`${API}/api/admin/patients`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setPatients(Array.isArray(data) ? data : []);
  }, [token, profile?.role]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);
  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const goNav = (id) => { setNavItem(id); setSelected(null); };
  const viewPatient = (p) => { setSelected(p); setNavItem('patients'); };

  return (
    <div style={S.root}>
      {/* Sidebar */}
      <aside style={S.nav}>
        <div style={S.navBrand}>
          <div style={S.navLogo}>N</div>
          <div>
            <div style={S.navTitle}>NUTRIRPG</div>
            <div style={S.navRole}>{isAdmin ? 'Administrador' : 'Nutricionista'}</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '8px 0' }}>
          {navItems.map(n => {
            const active = navItem === n.id && !selected;
            return (
              <button key={n.id} style={{ ...S.navBtn, ...(active ? S.navBtnActive : {}) }} onClick={() => goNav(n.id)}>
                <span>{n.label}</span>
                {n.id === 'patients' && patients.length > 0 && (
                  <span style={{ ...S.navCount, ...(active ? { backgroundColor: C.RED, color: C.WHITE } : {}) }}>
                    {patients.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <button style={S.logoutNavBtn} onClick={() => goNav('password')}>Alterar Senha</button>
        <button style={{ ...S.logoutNavBtn, marginTop: 0, color: C.RED, borderColor: C.RED }} onClick={onLogout}>Sair →</button>
      </aside>

      {/* Content */}
      <main style={S.content}>
        {!profileReady ? (
          <EmptyMsg>A carregar...</EmptyMsg>
        ) : isAdmin ? (
          navItem === 'admin-users' ? (
            <PlatformAdminUsers token={token} API={API} apiFetch={apiFetch} C={C} S={S} PixelBtn={PixelBtn} Badge={Badge} />
          ) : navItem === 'password' ? (
            <ChangePassword token={token} />
          ) : (
            <PlatformAdminHome token={token} API={API} apiFetch={apiFetch} C={C} S={S} Badge={Badge} />
          )
        ) : selected ? (
          <PatientDetail patient={selected} token={token} onBack={() => setSelected(null)} />
        ) : navItem === 'patients' ? (
          <PatientsHome patients={patients} onSelectPatient={viewPatient} onGoManage={() => goNav('manage')} />
        ) : navItem === 'recipes' ? (
          <RecipesLibrary token={token} />
        ) : navItem === 'products' ? (
          <ProductsCatalog token={token} />
        ) : navItem === 'password' ? (
          <ChangePassword token={token} />
        ) : (
          <ManagePatients token={token} patients={patients} onRefresh={fetchPatients} onViewPatient={viewPatient} />
        )}
      </main>
    </div>
  );
};

// ---- Styles -----------------------------------------------------------------

const S = {
  root:    { display: 'flex', minHeight: '100vh', backgroundColor: C.BG, fontFamily: "'Courier New', Courier, monospace", color: C.TEXT },
  nav:     { width: 220, backgroundColor: C.CARD, borderRight: `2px solid ${C.BORDER}`, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' },
  content: { flex: 1, padding: 32, overflowY: 'auto' },

  navBrand:    { padding: '20px 24px 16px', display: 'flex', gap: 10, alignItems: 'center', borderBottom: `2px solid ${C.BORDER}` },
  navLogo:     { width: 38, height: 38, backgroundColor: C.RED, border: `2px solid ${C.BORDER}`, boxShadow: '3px 3px 0 #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 },
  navTitle:    { color: C.RED, fontWeight: 'bold', fontSize: 13, letterSpacing: 2 },
  navRole:     { color: C.MUTED, fontSize: 10, letterSpacing: 1, marginTop: 2 },
  navBtn:      { display: 'flex', alignItems: 'center', gap: 10, width: '100%', paddingTop: 12, paddingBottom: 12, paddingLeft: 24, paddingRight: 24, background: 'none', border: 'none', borderLeft: '3px solid transparent', color: C.MUTED, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, textAlign: 'left' },
  navBtnActive:{ backgroundColor: C.INPUT, color: C.TEXT, fontWeight: 'bold', borderLeft: `3px solid ${C.RED}` },
  navCount:    { marginLeft: 'auto', backgroundColor: C.ALT, color: C.MUTED, border: `1px solid ${C.BORDER}`, fontSize: 10, padding: '1px 6px', fontWeight: 'bold' },
  logoutNavBtn:{ margin: '12px 16px', padding: '8px 24px', backgroundColor: C.INPUT, border: `2px solid ${C.BORDER}`, color: C.MUTED, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, boxShadow: '2px 2px 0 #000', textAlign: 'center' },

  patientGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: 16 },
  patientCard: { backgroundColor: C.CARD, border: `2px solid ${C.BORDER}`, boxShadow: '4px 4px 0 #000', padding: 16, cursor: 'pointer', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', transition: 'box-shadow .1s, transform .1s' },
  avatarCircle:   { width: 40, height: 40, backgroundColor: C.RED, border: `2px solid ${C.BORDER}`, color: C.WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18, flexShrink: 0 },
  avatarCircleLg: { width: 52, height: 52, backgroundColor: C.RED, border: `2px solid ${C.BORDER}`, color: C.WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 24, flexShrink: 0 },

  centerBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' },

  statsRow: { display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: 100, backgroundColor: C.CARD, border: `2px solid ${C.BORDER}`, boxShadow: '4px 4px 0 #000', padding: 16, borderTop: `4px solid ${C.RED}`, textAlign: 'center' },

  tabBar:    { display: 'flex', borderBottom: `2px solid ${C.BORDER}`, marginBottom: 24 },
  tab:       { padding: '10px 20px', background: 'none', border: 'none', color: C.MUTED, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, borderBottom: '3px solid transparent', marginBottom: -2 },
  tabActive: { color: C.TEXT, fontWeight: 'bold', borderBottomColor: C.RED },
  tabBadge:  { backgroundColor: C.RED, color: C.WHITE, fontSize: 10, padding: '1px 6px', marginLeft: 6, fontWeight: 'bold' },

  sectionTitle: { color: C.GOLD, marginBottom: 14, marginTop: 0, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },

  table: { width: '100%', borderCollapse: 'collapse' },
  th:    { backgroundColor: C.ALT, color: C.MUTED, padding: '10px 14px', textAlign: 'left', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', borderBottom: `2px solid ${C.BORDER}` },
  td:    { padding: '10px 14px', borderBottom: `1px solid ${C.INPUT}`, color: C.TEXT, fontSize: 13 },

  formCard: { backgroundColor: C.CARD, border: `2px solid ${C.BORDER}`, boxShadow: '4px 4px 0 #000', padding: 20, marginBottom: 20 },
  label:    { display: 'block', color: C.MUTED, fontSize: 10, letterSpacing: 2, marginBottom: 5, textTransform: 'uppercase' },
  input:    { display: 'block', width: '100%', padding: '9px 12px', backgroundColor: C.INPUT, border: `2px solid ${C.BORDER}`, color: C.TEXT, fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box', marginBottom: 12, outline: 'none' },

  recipeCard: { backgroundColor: C.CARD, border: `2px solid ${C.BORDER}`, boxShadow: '3px 3px 0 #000', borderLeft: `4px solid ${C.PURPLE}`, padding: 16, marginBottom: 12 },
  recipeAccordion: { backgroundColor: C.CARD, border: `2px solid ${C.BORDER}`, boxShadow: '3px 3px 0 #000', borderLeft: `4px solid ${C.PURPLE}`, marginBottom: 12, overflow: 'hidden' },
  recipeAccordionHeader: { display: 'flex', alignItems: 'stretch' },
  recipeAccordionToggle: { flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' },
  recipeAccordionName: { color: C.TEXT, fontWeight: 'bold', fontSize: 15, flex: 1 },
  recipeAccordionChevron: { color: C.PURPLE, fontSize: 11, fontWeight: 'bold', flexShrink: 0 },
  recipeAccordionDelete: { background: 'none', border: 'none', borderLeft: `1px solid ${C.INPUT}`, color: C.MUTED, cursor: 'pointer', fontSize: 20, padding: '0 14px', lineHeight: 1 },
  recipeAccordionBody: { padding: '12px 16px 16px', borderTop: `1px solid ${C.INPUT}` },
  recipeAccordionLabel: { color: C.BLUE, fontSize: 11, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' },
  ingTag:     { backgroundColor: C.INPUT, color: C.TEXT, fontSize: 12, padding: '3px 10px', border: `1px solid ${C.BORDER}` },
  manageRow:  { backgroundColor: C.CARD, border: `2px solid ${C.BORDER}`, boxShadow: '4px 4px 0 #000', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12, transition: 'box-shadow .1s, transform .1s' },
  productTag: { backgroundColor: C.CARD, border: `2px solid ${C.BORDER}`, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 },
};

export default Dashboard;

