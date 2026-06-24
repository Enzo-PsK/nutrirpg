import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const LAST_USER_KEY = 'nutrirpg_last_user';

/** Fallback em memória se o storage nativo falhar */
let memoryCache = null;

function readWeb() {
  try {
    return globalThis.localStorage?.getItem(LAST_USER_KEY) ?? null;
  } catch {
    return null;
  }
}

function writeWeb(value) {
  try {
    globalThis.localStorage?.setItem(LAST_USER_KEY, value);
  } catch {
    /* ignore */
  }
}

/** Guarda o último email/username usado no login (não bloqueia o fluxo se falhar). */
export async function saveLastUser(identifier) {
  if (!identifier?.trim()) return;
  const value = identifier.trim();
  memoryCache = value;

  if (Platform.OS === 'web') {
    writeWeb(value);
    return;
  }

  try {
    await SecureStore.setItemAsync(LAST_USER_KEY, value);
  } catch (e) {
    console.warn('lastUserStorage: não foi possível guardar', e?.message);
  }
}

/** Lê o último email/username; devolve null se indisponível. */
export async function getLastUser() {
  if (Platform.OS === 'web') {
    return readWeb() ?? memoryCache;
  }

  try {
    const stored = await SecureStore.getItemAsync(LAST_USER_KEY);
    if (stored) memoryCache = stored;
    return stored ?? memoryCache;
  } catch (e) {
    console.warn('lastUserStorage: não foi possível ler', e?.message);
    return memoryCache;
  }
}
