// src/screens/ProfileScreen.js — NutriRPG 8-bit Edition
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  PixelButton, PixelCard, PixelInput, PixelBadge, PixelProgress, PixelDivider,
  COLORS, PIXEL, RPG,
} from '../components/pixel';
import API_URL from '../config/api';
import { apiFetch } from '../utils/apiFetch';
import { useRegisterRefresh, usePullToRefresh } from '../context/AppRefreshContext';

const ACTION_LABELS = {
  drink_water:        '💧 Bebeu Água',
  eat_fruit:          '🍎 Comeu Fruta',
  eat_vegetable:      '🥦 Comeu Legumes',
  complete_meal_plan: '🍳 Cozinhou Receita',
  complete_recipe:      '🍳 Cozinhou Receita',
};

const ProfileScreen = ({ user, onLogout }) => {
  const [xpHistory,    setXpHistory]   = useState([]);
  const [xpStatus,     setXpStatus]    = useState({ level: 1, xp_total: 0, progress_to_next_level: 0 });
  const [editWeight,   setEditWeight]  = useState(false);
  const [weight,       setWeight]      = useState(String(user?.weight_kg || ''));
  const [savedWeight,  setSavedWeight] = useState(user?.weight_kg || null);
  const [nutritionist, setNutritionist] = useState(null);
  // Change password
  const [showPwdForm,  setShowPwdForm] = useState(false);
  const [currentPwd,   setCurrentPwd]  = useState('');
  const [newPwd,       setNewPwd]      = useState('');
  const [confirmPwd,   setConfirmPwd]  = useState('');
  const { refreshing, onRefresh } = usePullToRefresh();
  const editWeightRef = useRef(editWeight);
  editWeightRef.current = editWeight;

  const authHeaders = {
    Authorization: `Bearer ${user.token}`,
    'Content-Type': 'application/json',
  };

  const fetchHistory = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/xp/history`, { headers: authHeaders });
      const data = await res.json();
      setXpHistory(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  }, [user.token]);

  const fetchXpStatus = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/xp/status`, { headers: authHeaders });
      setXpStatus(await res.json());
    } catch (e) { console.error(e); }
  }, [user.token]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/user/profile`, { headers: authHeaders });
      if (!res.ok) return;
      const data = await res.json();
      if (data.weight_kg != null) {
        setSavedWeight(data.weight_kg);
        if (!editWeightRef.current) setWeight(String(data.weight_kg));
      }
      setNutritionist(data.nutritionist || null);
    } catch (e) { console.error(e); }
  }, [user.token]);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchHistory(), fetchXpStatus(), fetchProfile()]);
  }, [fetchHistory, fetchXpStatus, fetchProfile]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useRegisterRefresh('profile', fetchAll);

  const changePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      Alert.alert('[ ERRO ]', 'Preenche todos os campos.');
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert('[ ERRO ]', 'As senhas nao coincidem.');
      return;
    }
    if (newPwd.length < 6) {
      Alert.alert('[ ERRO ]', 'A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    try {
      const res = await apiFetch(`${API_URL}/api/user/change-password`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ current_password: currentPwd, new_password: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      Alert.alert('✓ SENHA ALTERADA', 'A tua senha foi atualizada com sucesso.');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setShowPwdForm(false);
    } catch (e) {
      Alert.alert('[ ERRO ]', e.message);
    }
  };

  const saveWeight = async () => {
    const kg = parseFloat(weight);
    if (!kg || kg <= 0) {
      Alert.alert('[ ERRO ]', 'Insere um peso válido em kg.');
      return;
    }
    try {
      // update profile + log to weight_logs
      await apiFetch(`${API_URL}/api/user/weight`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ weight_kg: kg }),
      });
      setSavedWeight(kg);
      setEditWeight(false);
      Alert.alert('✓ GUARDADO', 'Peso atualizado. Meta de hidratação recalculada.');
    } catch (e) { Alert.alert('[ ERRO ]', e.message); }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.RED]}
          tintColor={COLORS.RED}
        />
      }
    >
      <Text style={s.screenTitle}>PERFIL</Text>

      {/* ── Character Card ── */}
      <PixelCard accentColor={COLORS.RED} accentTop>
        {user?.first_name || user?.last_name ? (
          <>
            <Text style={s.fullName}>
              {[user.first_name, user.last_name].filter(Boolean).join(' ')}
            </Text>
            <Text style={s.username}>{user?.username}</Text>
          </>
        ) : (
          <Text style={s.username}>{user?.username}</Text>
        )}
        <Text style={s.email}>{user?.email}</Text>

        {user?.patient_code && (
          <View style={s.codeBox}>
            <Text style={s.codeLabel}>CODIGO DE PACIENTE</Text>
            <Text style={s.codeValue}>{user.patient_code}</Text>
          </View>
        )}

        <PixelDivider color={COLORS.MUTED} style={{ marginVertical: 12 }} />

        {/* Stat row */}
        <View style={s.statsRow}>
          <StatBox label="NÍVEL"   value={xpStatus.level}   color={COLORS.GOLD}   />
          <StatBox label="XP"      value={xpStatus.xp_total} color={COLORS.RED}   />
          <StatBox label="PESO"    value={savedWeight ? `${savedWeight}kg` : '—'} color={COLORS.BLUE} />
        </View>

        <PixelDivider color={COLORS.MUTED} style={{ marginVertical: 12 }} />

        {/* XP Progress */}
        <Text style={s.barLabel}>▸ PROGRESSO NÍVEL {xpStatus.level}</Text>
        <PixelProgress
          value={xpStatus.progress_to_next_level}
          max={100}
          color={RPG.XP}
          height={20}
          sublabel={`${xpStatus.progress_to_next_level}% para nível ${xpStatus.level + 1}`}
        />
      </PixelCard>

      {nutritionist && (
        <PixelCard accentColor={COLORS.GREEN} style={s.section}>
          <Text style={s.sectionTitle}>🩺 NUTRICIONISTA</Text>
          <Text style={s.nutriName}>
            {[nutritionist.first_name, nutritionist.last_name].filter(Boolean).join(' ')
              || nutritionist.username}
          </Text>
          <Text style={s.nutriEmail}>{nutritionist.email}</Text>
        </PixelCard>
      )}

      {/* ── Weight Editor ── */}
      <PixelCard accentColor={COLORS.BLUE} style={s.section}>
        <Text style={s.sectionTitle}>⚖️ PESO CORPORAL</Text>

        {editWeight ? (
          /* ── Edit mode ── */
          <View style={s.editRow}>
            <View style={{ flex: 1 }}>
              <PixelInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="ex: 70"
                containerStyle={{ marginBottom: 0 }}
              />
            </View>
            <View style={{ width: 8 }} />
            <PixelButton variant="primary" size="sm" fullWidth={false} onPress={saveWeight}>
              GUARDAR
            </PixelButton>
            <View style={{ width: 6 }} />
            <PixelButton variant="ghost" size="sm" fullWidth={false} onPress={() => setEditWeight(false)}>
              ✕
            </PixelButton>
          </View>

        ) : savedWeight ? (
          /* ── Weight set — show value + small "Alterar" button ── */
          <View style={s.weightDisplay}>
            <View style={s.weightValueRow}>
              <Text style={s.weightValue}>{savedWeight}</Text>
              <Text style={s.weightUnit}> kg</Text>
            </View>
            <PixelButton
              variant="outline"
              size="sm"
              fullWidth={false}
              onPress={() => { setWeight(String(savedWeight)); setEditWeight(true); }}
            >
              ALTERAR
            </PixelButton>
          </View>

        ) : (
          /* ── No weight set yet ── */
          <PixelButton variant="primary" size="md" onPress={() => setEditWeight(true)}>
            + DEFINIR PESO
          </PixelButton>
        )}
      </PixelCard>

      {/* ── XP History ── */}
      <PixelCard accentColor={COLORS.GOLD} style={s.section}>
        <Text style={s.sectionTitle}>📜 HISTÓRICO XP</Text>

        {xpHistory.length === 0 ? (
          <Text style={s.emptyText}>Nenhuma ação registada ainda.</Text>
        ) : (
          xpHistory.slice(0, 10).map((log, i) => (
            <View key={i} style={[s.logRow, i > 0 && s.logRowBorder]}>
              <Text style={s.logAction}>
                {ACTION_LABELS[log.action] || log.action?.replace(/_/g, ' ') || '—'}
              </Text>
              <PixelBadge variant="success">+{log.xp_gained} XP</PixelBadge>
            </View>
          ))
        )}
      </PixelCard>

      {/* ── Change Password ── */}
      <PixelCard accentColor={COLORS.PURPLE} style={s.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={s.sectionTitle}>🔑 SENHA</Text>
          <PixelButton
            variant={showPwdForm ? 'ghost' : 'outline'}
            size="sm"
            fullWidth={false}
            onPress={() => { setShowPwdForm(v => !v); setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); }}
          >
            {showPwdForm ? 'CANCELAR' : 'ALTERAR SENHA'}
          </PixelButton>
        </View>

        {showPwdForm && (
          <View style={{ marginTop: 12 }}>
            <PixelInput
              label="Senha atual"
              placeholder="A tua senha atual"
              secureTextEntry
              value={currentPwd}
              onChangeText={setCurrentPwd}
            />
            <PixelInput
              label="Nova senha"
              placeholder="Minimo 6 caracteres"
              secureTextEntry
              value={newPwd}
              onChangeText={setNewPwd}
            />
            <PixelInput
              label="Confirmar nova senha"
              placeholder="Repete a nova senha"
              secureTextEntry
              value={confirmPwd}
              onChangeText={setConfirmPwd}
            />
            <PixelButton variant="secondary" onPress={changePassword}>
              GUARDAR NOVA SENHA
            </PixelButton>
          </View>
        )}
      </PixelCard>

      {/* ── Logout ── */}
      <PixelButton variant="destructive" size="lg" onPress={onLogout} style={{ marginBottom: 32 }}>
        TERMINAR SESSAO
      </PixelButton>
    </ScrollView>
    </SafeAreaView>
  );
};

const StatBox = ({ label, value, color }) => (
  <View style={[st.statBox, { borderTopColor: color }]}>
    <Text style={[st.statValue, { color }]}>{value}</Text>
    <Text style={st.statLabel}>{label}</Text>
  </View>
);

const st = StyleSheet.create({
  statBox: {
    flex: 1,
    alignItems: 'center',
    borderTopWidth: 3,
    paddingTop: 8,
    marginHorizontal: 4,
  },
  statValue: { fontFamily: PIXEL.FONT, fontSize: 22 },
  statLabel: { fontFamily: PIXEL.FONT, fontSize: 9, color: COLORS.MUTED, marginTop: 2, letterSpacing: 1 },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BG },
  root: { flex: 1, backgroundColor: COLORS.BG },
  content: { padding: 16, paddingTop: 20, paddingBottom: 40 },

  screenTitle: {
    fontFamily: PIXEL.FONT, fontSize: 18,
    color: COLORS.TEXT, letterSpacing: 2, marginBottom: 14,
  },
  fullName: {
    fontFamily: PIXEL.FONT, fontSize: 22,
    color: COLORS.RED, letterSpacing: 1,
  },
  username: {
    fontFamily: PIXEL.FONT, fontSize: 12, color: COLORS.MUTED,
    letterSpacing: 1, marginTop: 2,
  },
  email: {
    fontFamily: PIXEL.FONT, fontSize: 11, color: COLORS.MUTED, marginTop: 2,
  },
  barLabel: {
    fontFamily: PIXEL.FONT, fontSize: 10, color: COLORS.MUTED,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2,
  },
  statsRow: { flexDirection: 'row' },

  section: { marginTop: 12 },
  nutriName: {
    fontFamily: PIXEL.FONT, fontSize: 16,
    color: COLORS.GREEN, letterSpacing: 1,
  },
  nutriEmail: {
    fontFamily: PIXEL.FONT, fontSize: 11, color: COLORS.MUTED, marginTop: 6,
  },
  sectionTitle: {
    fontFamily: PIXEL.FONT, fontSize: 12,
    color: COLORS.TEXT, letterSpacing: 2, marginBottom: 12,
  },
  editRow: { flexDirection: 'row', alignItems: 'center' },

  weightDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weightValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  weightValue: {
    fontFamily: PIXEL.FONT, fontSize: 36, color: COLORS.BLUE,
  },
  weightUnit: {
    fontFamily: PIXEL.FONT, fontSize: 16, color: COLORS.MUTED, marginLeft: 2,
  },

  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  logRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.INPUT },
  logAction: { fontFamily: PIXEL.FONT, fontSize: 12, color: COLORS.TEXT, flex: 1 },

  emptyText: { fontFamily: PIXEL.FONT, fontSize: 12, color: COLORS.MUTED, fontStyle: 'italic' },

  codeBox: {
    marginTop: 12,
    backgroundColor: COLORS.INPUT,
    borderWidth: 2,
    borderColor: COLORS.BLACK,
    padding: 10,
    alignItems: 'center',
  },
  codeLabel: {
    fontFamily: PIXEL.FONT, fontSize: 9, color: COLORS.MUTED,
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4,
  },
  codeValue: {
    fontFamily: PIXEL.FONT, fontSize: 24,
    color: COLORS.TEXT, letterSpacing: 6,
  },
});

export default ProfileScreen;
