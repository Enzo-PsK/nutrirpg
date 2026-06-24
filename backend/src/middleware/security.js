// src/middleware/security.js — rate limiting + input validation
const rateLimit = require('express-rate-limit');

// ── Rate limiters ─────────────────────────────────────────────────────────────

// Login: max 10 attempts per 15 min per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas tentativas de login. Tente novamente em 15 minutos.' },
  skipSuccessfulRequests: true, // only counts failed attempts
});

// Register: max 5 accounts per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados registos a partir deste endereço. Tente mais tarde.' },
});

// General API: 200 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados pedidos. Abrande e tente novamente.' },
});

// ── Input validation helpers ──────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (v) => typeof v === 'string' && EMAIL_RE.test(v.trim());
const isNonEmpty   = (v) => typeof v === 'string' && v.trim().length > 0;
const isMinLen     = (v, n) => typeof v === 'string' && v.length >= n;
const isMaxLen     = (v, n) => typeof v === 'string' && v.length <= n;
const isPositiveNum= (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0;

// Generic validation middleware factory
// rules: array of { field, checks: [{ test, msg }] }
const validate = (rules) => (req, res, next) => {
  const errors = [];
  for (const { field, checks } of rules) {
    const val = req.body[field];
    for (const { test, msg } of checks) {
      if (!test(val)) { errors.push(msg); break; }
    }
  }
  if (errors.length > 0) return res.status(400).json({ error: errors[0] });
  next();
};

// ── Preset validators ─────────────────────────────────────────────────────────

const validateLogin = validate([
  { field: 'email',    checks: [{ test: isNonEmpty, msg: 'Email ou username é obrigatório' }] },
  { field: 'password', checks: [{ test: isNonEmpty, msg: 'Password é obrigatória' }] },
]);

const validateRegister = validate([
  { field: 'first_name', checks: [{ test: isNonEmpty, msg: 'Primeiro nome é obrigatório' }, { test: v => isMaxLen(v, 80), msg: 'Primeiro nome demasiado longo' }] },
  { field: 'last_name',  checks: [{ test: isNonEmpty, msg: 'Último nome é obrigatório' },   { test: v => isMaxLen(v, 80), msg: 'Último nome demasiado longo' }] },
  { field: 'email',      checks: [{ test: isNonEmpty, msg: 'Email é obrigatório' },          { test: isValidEmail, msg: 'Email inválido' }] },
  { field: 'password',   checks: [{ test: v => isMinLen(v, 6), msg: 'A password deve ter pelo menos 6 caracteres' }, { test: v => isMaxLen(v, 128), msg: 'Password demasiado longa' }] },
]);

const validateProduct = validate([
  { field: 'name', checks: [{ test: isNonEmpty, msg: 'Nome do ingrediente é obrigatório' }, { test: v => isMaxLen(v, 100), msg: 'Nome demasiado longo (máx 100 caracteres)' }] },
  { field: 'unit', checks: [{ test: v => ['g', 'kg', 'ml', 'l', 'un'].includes(v), msg: 'Unidade inválida. Use: g, kg, ml, l ou un' }] },
]);

const validateCategory = validate([
  { field: 'name', checks: [{ test: isNonEmpty, msg: 'Nome da categoria é obrigatório' }, { test: v => isMaxLen(v, 80), msg: 'Nome demasiado longo' }] },
]);

const validateWeight = validate([
  { field: 'weight_kg', checks: [{ test: isPositiveNum, msg: 'Peso inválido' }, { test: v => parseFloat(v) < 500, msg: 'Peso inválido' }] },
]);

const validateChangePassword = validate([
  { field: 'current_password', checks: [{ test: isNonEmpty, msg: 'Password atual é obrigatória' }] },
  { field: 'new_password',     checks: [{ test: v => isMinLen(v, 6), msg: 'Nova password deve ter pelo menos 6 caracteres' }, { test: v => isMaxLen(v, 128), msg: 'Password demasiado longa' }] },
]);

module.exports = {
  loginLimiter,
  registerLimiter,
  apiLimiter,
  validateLogin,
  validateRegister,
  validateProduct,
  validateCategory,
  validateWeight,
  validateChangePassword,
};
