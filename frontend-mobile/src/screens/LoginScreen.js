// src/screens/LoginScreen.js — NutriRPG 8-bit Edition
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { getLastUser, saveLastUser } from '../utils/lastUserStorage';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  PixelButton, PixelCard, PixelInput, PixelDivider,
  COLORS, PIXEL,
} from '../components/pixel';
import API_URL from '../config/api';

const LoginScreen = ({ onLogin }) => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    first_name: '', last_name: '', identifier: '', password: '', confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [lastSavedUser, setLastSavedUser] = useState('');

  // Pre-fill identifier only for login (not register)
  useEffect(() => {
    getLastUser().then(saved => {
      if (saved) {
        setLastSavedUser(saved);
        setForm(f => ({ ...f, identifier: saved }));
      }
    });
  }, []);

  const switchMode = async (toRegister) => {
    if (toRegister) {
      setMode('register');
      setForm(f => ({
        ...f,
        identifier: '',
        password: '',
        confirm_password: '',
        first_name: '',
        last_name: '',
      }));
      return;
    }
    const saved = lastSavedUser || (await getLastUser()) || '';
    if (saved) setLastSavedUser(saved);
    setMode('login');
    setForm(f => ({
      ...f,
      identifier: saved,
      password: '',
      confirm_password: '',
      first_name: '',
      last_name: '',
    }));
  };

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.identifier || !form.password) {
      Alert.alert('[ ERRO ]', 'Email e password são obrigatórios');
      return;
    }
    if (mode === 'register') {
      if (!form.first_name?.trim() || !form.last_name?.trim()) {
        Alert.alert('[ ERRO ]', 'Primeiro e último nome são obrigatórios');
        return;
      }
      if (form.password !== form.confirm_password) {
        Alert.alert('[ ERRO ]', 'As passwords não coincidem');
        return;
      }
      if (form.password.length < 6) {
        Alert.alert('[ ERRO ]', 'A password deve ter pelo menos 6 caracteres');
        return;
      }
    }
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login'
        ? { email: form.identifier, password: form.password }
        : {
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.identifier,
            password: form.password,
          };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido');
      await saveLastUser(form.identifier);
      setLastSavedUser(form.identifier.trim());
      onLogin({ ...data.user, token: data.token });
    } catch (err) {
      Alert.alert('[ ERRO ]', err.message);
    } finally {
      setLoading(false);
    }
  };

  const isRegister = mode === 'register';

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Logo ── */}
        <View style={s.logoArea}>
          <Text style={s.logo}>NutriRPG</Text>
        </View>

        {/* ── Auth card ── */}
        <PixelCard accentColor={COLORS.RED} accentTop style={s.card}>
          {isRegister && (
            <>
              <Text style={s.cardTitle}>[ CRIAR CONTA ]</Text>
              <PixelDivider color={COLORS.RED} style={{ marginBottom: 16, marginTop: 4 }} />
            </>
          )}

          {/* Register-only fields */}
          {isRegister && (
            <>
              <PixelInput
                label="Primeiro Nome"
                placeholder="ex: João"
                placeholderTextColor={COLORS.MUTED}
                value={form.first_name}
                onChangeText={set('first_name')}
              />
              <PixelInput
                label="Último Nome"
                placeholder="ex: Silva"
                placeholderTextColor={COLORS.MUTED}
                value={form.last_name}
                onChangeText={set('last_name')}
              />
            </>
          )}

          <PixelInput
            label={isRegister ? 'Email' : 'Email ou Username'}
            placeholder="heroi@reino.pt"
            placeholderTextColor={COLORS.MUTED}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={isRegister ? 'email-address' : 'default'}
            value={form.identifier}
            onChangeText={set('identifier')}
          />
          <PixelInput
            label="Password"
            placeholder="••••••••"
            placeholderTextColor={COLORS.MUTED}
            secureTextEntry
            value={form.password}
            onChangeText={set('password')}
          />
          {isRegister && (
            <PixelInput
              label="Confirmar Password"
              placeholder="Repete a password"
              placeholderTextColor={COLORS.MUTED}
              secureTextEntry
              value={form.confirm_password}
              onChangeText={set('confirm_password')}
            />
          )}

          <View style={{ height: 8 }} />

          <PixelButton
            variant="primary"
            onPress={handleSubmit}
            disabled={loading}
            size="lg"
          >
            {loading
              ? '[ A PROCESSAR... ]'
              : isRegister ? '[ REGISTAR ]' : '[ LOGIN ]'}
          </PixelButton>

          <PixelDivider color={COLORS.MUTED} style={{ marginVertical: 16 }} />

          <PixelButton
            variant="ghost"
            onPress={() => switchMode(!isRegister)}
            size="sm"
          >
            {isRegister
              ? 'Já tens conta? Entrar'
              : 'Não tens conta? Registar'}
          </PixelButton>
        </PixelCard>

        {/* ── Footer ── */}
        <Text style={s.footer}>v1.0 · NutriRPG © 2026</Text>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BG },
  root: { flex: 1, backgroundColor: COLORS.BG },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingVertical: 40 },

  logoArea: { alignItems: 'center', marginBottom: 28, position: 'relative' },
  logo: {
    fontFamily: PIXEL.LOGO,
    fontSize: 40,
    color: COLORS.BLACK,
    letterSpacing: 1,
  },
  card: { marginHorizontal: 0 },
  cardTitle: {
    fontFamily: PIXEL.FONT,
    fontSize: 16,
    color: COLORS.TEXT,
    textAlign: 'center',
    letterSpacing: 2,
  },

  footer: {
    fontFamily: PIXEL.FONT,
    fontSize: 10,
    color: COLORS.MUTED,
    textAlign: 'center',
    marginTop: 24,
    opacity: 0.5,
  },
});

export default LoginScreen;
