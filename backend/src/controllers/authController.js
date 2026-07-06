// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const stripAccents = (str) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Primeira letra do primeiro nome + último sobrenome (ex: Joao Vitor + ... Guimaraes → jguimaraes) */
const buildBaseUsername = (first_name, last_name) => {
  const firstWord = stripAccents(first_name.trim().split(/\s+/)[0] || '');
  const lastWord  = stripAccents(last_name.trim().split(/\s+/).pop() || '');
  const initial   = firstWord.charAt(0).toLowerCase();
  const surname   = lastWord.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${initial}${surname}`;
};

const generateUniqueUsername = async (first_name, last_name) => {
  const base = buildBaseUsername(first_name, last_name);
  if (!base || base.length < 2) {
    throw new Error('Não foi possível gerar username a partir do nome');
  }
  let username = base;
  let suffix = 1;
  while (await User.findOne({ where: { username } })) {
    username = `${base}${suffix++}`;
  }
  return username;
};

const generatePatientCode = async () => {
  let code, exists;
  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
    exists = await User.findOne({ where: { patient_code: code } });
  } while (exists);
  return code;
};

const register = async (req, res) => {
  try {
    const { first_name, last_name, email, password, weight_kg } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'Primeiro e último nome são obrigatórios' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email já registado' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const patient_code = await generatePatientCode();
    const username = await generateUniqueUsername(first_name, last_name);

    const user = await User.create({
      username,
      first_name,
      last_name,
      email,
      password_hash,
      weight_kg: weight_kg || null,
      patient_code,
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Utilizador criado com sucesso',
      token,
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        level: user.level,
        xp_total: user.xp_total,
        patient_code: user.patient_code,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const identifier = (email || '').trim();

    // Accept email or username
    const isEmail = identifier.includes('@');
    const user = isEmail
      ? await User.findOne({ where: { email: identifier } })
      : await User.findOne({ where: { username: identifier } });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (user.disabled) {
      return res.status(403).json({ error: 'Conta desactivada. Contacte o suporte.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        level: user.level,
        xp_total: user.xp_total,
        weight_kg: user.weight_kg,
        patient_code: user.patient_code,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const registerNutritionist = async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: 'Primeiro nome, último nome, email e password são obrigatórios' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email já registado' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const username = await generateUniqueUsername(first_name, last_name);

    const user = await User.create({
      username,
      first_name,
      last_name,
      email,
      password_hash,
      role: 'nutritionist',
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Nutricionista registado com sucesso',
      token,
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
};

module.exports = { register, login, registerNutritionist };

