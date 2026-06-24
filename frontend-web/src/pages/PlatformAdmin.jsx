import React, { useCallback, useEffect, useMemo, useState } from 'react';

const EmptyMsg = ({ children }) => (
  <p style={{ color: 'var(--c-muted)', fontSize: 13, fontStyle: 'italic', marginTop: 8 }}>{children}</p>
);

const Badge = ({ children, color = 'var(--c-red)' }) => (
  <span style={{
    backgroundColor: color + '22',
    color,
    border: `1px solid ${color}`,
    padding: '2px 8px',
    fontSize: 11,
    fontFamily: 'inherit',
    letterSpacing: 1,
  }}
  >
    {children}
  </span>
);

const roleLabel = (role) => {
  if (role === 'nutritionist') return 'Nutricionista';
  if (role === 'user') return 'Paciente';
  return role;
};

const displayName = (u) => {
  const full = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
  return full || u.username;
};

const collator = new Intl.Collator('pt', { sensitivity: 'base' });

const DEFAULT_SORT = { key: 'name', dir: 'asc' };

function compareValues(a, b, dir) {
  const mult = dir === 'desc' ? -1 : 1;
  if (typeof a === 'number' && typeof b === 'number') return (a - b) * mult;
  return collator.compare(String(a), String(b)) * mult;
}

function sortRows(rows, sortKey, direction, accessors) {
  const getter = accessors[sortKey];
  if (!getter) return rows;
  return [...rows].sort((a, b) => compareValues(getter(a), getter(b), direction));
}

function nextSort(current, column) {
  if (current.key !== column) return { key: column, dir: 'asc' };
  return { key: column, dir: current.dir === 'asc' ? 'desc' : 'asc' };
}

const SortableTh = ({ label, column, sort, onSort, style }) => {
  const active = sort.key === column;
  return (
    <th
      style={{ ...style, cursor: 'pointer', userSelect: 'none' }}
      onClick={() => onSort(column)}
      title="Ordenar"
    >
      {label}{active ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
    </th>
  );
};

export const PlatformAdminHome = ({ token, API, apiFetch, C, S, Badge }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`${API}/api/platform-admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar');
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [API, apiFetch, token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <EmptyMsg>A carregar dashboard...</EmptyMsg>;
  if (error) return <p style={{ color: C.RED, fontSize: 13 }}>{error}</p>;
  if (!data) return null;

  return (
    <div>
      <h2 style={{ color: C.TEXT, margin: '0 0 4px', fontSize: 22 }}>Início</h2>
      <p style={{ color: C.MUTED, margin: '0 0 24px', fontSize: 13 }}>
        Visão geral da plataforma NutriRPG
      </p>

      <div style={S.statsRow}>
        <div style={S.statCard}>
          <div style={{ color: C.MUTED, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>PACIENTES</div>
          <div style={{ color: C.RED, fontSize: 32, fontWeight: 'bold' }}>{data.patientCount}</div>
        </div>
        <div style={S.statCard}>
          <div style={{ color: C.MUTED, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>NUTRICIONISTAS</div>
          <div style={{ color: C.BLUE, fontSize: 32, fontWeight: 'bold' }}>{data.nutritionistCount}</div>
        </div>
      </div>

      <h3 style={S.sectionTitle}>Top 10 nutricionistas (por pacientes)</h3>
      {!data.topNutritionists?.length ? (
        <EmptyMsg>Sem nutricionistas registados.</EmptyMsg>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>#</th>
                <th style={S.th}>Nome</th>
                <th style={S.th}>Email</th>
                <th style={S.th}>Pacientes</th>
                <th style={S.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.topNutritionists.map((n, i) => (
                <tr key={n.id}>
                  <td style={S.td}>{i + 1}</td>
                  <td style={S.td}>{displayName(n)}</td>
                  <td style={S.td}>{n.email}</td>
                  <td style={S.td}>{n.patient_count}</td>
                  <td style={S.td}>
                    {n.disabled
                      ? <Badge color={C.RED}>Desactivado</Badge>
                      : <Badge color={C.GREEN}>Activo</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const PlatformAdminUsers = ({ token, API, apiFetch, C, S, PixelBtn, Badge }) => {
  const [tab, setTab] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [sort, setSort] = useState(DEFAULT_SORT);

  const sortedUsers = useMemo(() => sortRows(users, sort.key, sort.dir, {
    name: (u) => displayName(u),
    role: (u) => roleLabel(u.role),
    disabled: (u) => (u.disabled ? 'Desactivado' : 'Activo'),
  }), [users, sort]);

  useEffect(() => {
    setSort(DEFAULT_SORT);
  }, [tab]);

  const load = useCallback(async () => {
    setLoading(true);
    setMsg('');
    try {
      const q = tab === 'all' ? '' : `?role=${tab}`;
      const res = await apiFetch(`${API}/api/platform-admin/users${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao listar');
      setUsers(Array.isArray(json) ? json : []);
    } catch (e) {
      setMsg(`Erro: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [API, apiFetch, tab, token]);

  useEffect(() => { load(); }, [load]);

  const toggleDisabled = async (user) => {
    const action = user.disabled ? 'reactivar' : 'desactivar';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} a conta de ${displayName(user)}?`)) {
      return;
    }
    setBusyId(user.id);
    setMsg('');
    try {
      const res = await apiFetch(`${API}/api/platform-admin/users/${user.id}/disabled`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ disabled: !user.disabled }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMsg(json.message);
      await load();
    } catch (e) {
      setMsg(`Erro: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const deleteGdpr = async (user) => {
    const typed = window.prompt(
      `GDPR — eliminar TODOS os registos de ${displayName(user)}?\n\n`
      + 'Esta acção é irreversível. Escreve ELIMINAR para confirmar:',
    );
    if (typed !== 'ELIMINAR') return;

    setBusyId(user.id);
    setMsg('');
    try {
      const res = await apiFetch(`${API}/api/platform-admin/users/${user.id}/gdpr`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMsg(json.message);
      await load();
    } catch (e) {
      setMsg(`Erro: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const tabs = [
    { id: 'all', label: 'Todos' },
    { id: 'user', label: 'Pacientes' },
    { id: 'nutritionist', label: 'Nutricionistas' },
  ];

  return (
    <div>
      <h2 style={{ color: C.TEXT, margin: '0 0 4px', fontSize: 22 }}>Utilizadores</h2>
      <p style={{ color: C.MUTED, margin: '0 0 20px', fontSize: 13 }}>
        Consultar, desactivar ou eliminar registos (GDPR)
      </p>

      <div style={S.tabBar}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            style={{ ...S.tab, ...(tab === t.id ? S.tabActive : {}) }}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && (
        <p style={{
          color: msg.startsWith('Erro') ? C.RED : C.GREEN,
          fontSize: 13,
          marginBottom: 16,
        }}
        >
          {msg}
        </p>
      )}

      {loading ? (
        <EmptyMsg>A carregar utilizadores...</EmptyMsg>
      ) : users.length === 0 ? (
        <EmptyMsg>Nenhum utilizador encontrado.</EmptyMsg>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                <SortableTh label="Nome" column="name" sort={sort} onSort={(col) => setSort((s) => nextSort(s, col))} style={S.th} />
                <th style={S.th}>Email</th>
                <SortableTh label="Tipo" column="role" sort={sort} onSort={(col) => setSort((s) => nextSort(s, col))} style={S.th} />
                <th style={S.th}>Observações</th>
                <SortableTh label="Estado" column="disabled" sort={sort} onSort={(col) => setSort((s) => nextSort(s, col))} style={S.th} />
                <th style={{ ...S.th, textAlign: 'right' }}>Acções</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((u) => (
                <tr key={u.id} style={u.disabled ? { opacity: 0.65 } : undefined}>
                  <td style={S.td}>{displayName(u)}</td>
                  <td style={S.td}>{u.email}</td>
                  <td style={S.td}>{roleLabel(u.role)}</td>
                  <td style={S.td}>
                    {u.role === 'user' && u.patient_code && `Cód. ${u.patient_code}`}
                    {u.role === 'nutritionist' && `${u.patient_count ?? 0} paciente(s)`}
                  </td>
                  <td style={S.td}>
                    {u.disabled
                      ? <Badge color={C.RED}>Desactivado</Badge>
                      : <Badge color={C.GREEN}>Activo</Badge>}
                  </td>
                  <td style={{ ...S.td, textAlign: 'right' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
                      <PixelBtn
                        small
                        outline
                        color={u.disabled ? C.GREEN : C.GOLD}
                        disabled={busyId === u.id}
                        onClick={() => toggleDisabled(u)}
                      >
                        {u.disabled ? 'Activar' : 'Desactivar'}
                      </PixelBtn>
                      <PixelBtn
                        small
                        outline
                        color={C.RED}
                        disabled={busyId === u.id}
                        onClick={() => deleteGdpr(u)}
                      >
                        Eliminar (GDPR)
                      </PixelBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
