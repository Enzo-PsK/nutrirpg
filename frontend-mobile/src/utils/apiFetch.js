import { Alert } from 'react-native';

let onSessionEnded = null;
let sessionEnded = false;

const AUTH_SESSION_ERRORS = [
  'Conta desactivada',
  'Token inválido',
  'Utilizador não encontrado',
  'Token de acesso necessário',
];

export function registerSessionHandler(fn) {
  onSessionEnded = fn;
}

export function resetSessionGuard() {
  sessionEnded = false;
}

async function isAuthSessionError(res) {
  if (res.status === 401) return true;
  if (res.status !== 403) return false;
  try {
    const data = await res.clone().json();
    const msg = data?.error || '';
    return AUTH_SESSION_ERRORS.some((hint) => msg.includes(hint));
  } catch {
    return false;
  }
}

export async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!sessionEnded && (await isAuthSessionError(res))) {
    sessionEnded = true;
    onSessionEnded?.();
  }
  return res;
}

export async function endSessionIfInvalid(res) {
  if (!sessionEnded && (await isAuthSessionError(res))) {
    sessionEnded = true;
    onSessionEnded?.();
    return true;
  }
  return false;
}

export function showSessionEndedAlert() {
  Alert.alert(
    '[ SESSÃO TERMINADA ]',
    'A tua conta foi desactivada ou a sessão expirou. Inicia sessão novamente.',
  );
}
