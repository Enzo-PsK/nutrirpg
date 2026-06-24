import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import API_URL from '../config/api';
import { apiFetch } from './apiFetch';

const TOKEN_KEY = 'nutrirpg_auth_token';
const USER_CACHE_KEY = 'nutrirpg_auth_user';

/** Fallback em memória se o storage nativo falhar */
let memoryToken = null;
let memoryUser = null;

function readWebToken() {
  try {
    return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

function writeWebToken(value) {
  try {
    if (value) globalThis.localStorage?.setItem(TOKEN_KEY, value);
    else globalThis.localStorage?.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

function readWebUser() {
  try {
    const raw = globalThis.localStorage?.getItem(USER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeWebUser(value) {
  try {
    if (value) globalThis.localStorage?.setItem(USER_CACHE_KEY, JSON.stringify(value));
    else globalThis.localStorage?.removeItem(USER_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

async function getStoredToken() {
  if (Platform.OS === 'web') return readWebToken() ?? memoryToken;

  try {
    const stored = await SecureStore.getItemAsync(TOKEN_KEY);
    if (stored) memoryToken = stored;
    return stored ?? memoryToken;
  } catch (e) {
    console.warn('authStorage: não foi possível ler token', e?.message);
    return memoryToken;
  }
}

async function getUserCache() {
  if (Platform.OS === 'web') return readWebUser() ?? memoryUser;

  try {
    const raw = await SecureStore.getItemAsync(USER_CACHE_KEY);
    if (!raw) return memoryUser;
    const parsed = JSON.parse(raw);
    memoryUser = parsed;
    return parsed;
  } catch (e) {
    console.warn('authStorage: não foi possível ler cache do utilizador', e?.message);
    return memoryUser;
  }
}

/** Guarda token JWT e snapshot do perfil (para offline / erro de rede). */
export async function saveSession(session) {
  const { token, ...userFields } = session;
  if (!token) return;

  memoryToken = token;
  memoryUser = userFields;

  if (Platform.OS === 'web') {
    writeWebToken(token);
    writeWebUser(userFields);
    return;
  }

  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_CACHE_KEY, JSON.stringify(userFields));
  } catch (e) {
    console.warn('authStorage: não foi possível guardar sessão', e?.message);
  }
}

/** Remove token e cache — chamado no logout ou quando o token expira. */
export async function clearSession() {
  memoryToken = null;
  memoryUser = null;

  if (Platform.OS === 'web') {
    writeWebToken(null);
    writeWebUser(null);
    return;
  }

  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_CACHE_KEY);
  } catch (e) {
    console.warn('authStorage: não foi possível limpar sessão', e?.message);
  }
}

/**
 * Restaura sessão ao arrancar a app (como o portal web).
 * Valida o token com /api/user/profile; limpa se inválido; mantém em erro de rede.
 */
export async function restoreSession() {
  const token = await getStoredToken();
  if (!token) return null;

  try {
    const res = await apiFetch(`${API_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const profile = await res.json();
      const session = { ...profile, token };
      await saveSession(session);
      return session;
    }

    await clearSession();
    return null;
  } catch {
    const cached = await getUserCache();
    if (cached) return { ...cached, token };
    return { token };
  }
}
