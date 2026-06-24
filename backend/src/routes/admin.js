// src/routes/admin.js — NutriRPG Admin Routes (nutricionista)
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const sequelize = require('../config/database');
const User = require('../models/User');
const XPLog = require('../models/XPLog');
const HydrationLog = require('../models/HydrationLog');
const NutritionistPatient = require('../models/NutritionistPatient');
const { Op } = require('sequelize');

const router = express.Router();

const requireNutritionist = (req, res, next) => {
  if (req.user.role !== 'nutritionist' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso reservado a nutricionistas' });
  }
  next();
};

router.use(authenticateToken, requireNutritionist);

// Listar os meus pacientes
router.get('/patients', async (req, res) => {
  try {
    const links = await NutritionistPatient.findAll({
      where: { nutritionist_id: req.user.id },
    });
    const patientIds = links.map(l => l.patient_id);
    if (patientIds.length === 0) return res.json([]);

    const patients = await User.findAll({
      where: { id: { [Op.in]: patientIds } },
      attributes: ['id', 'username', 'first_name', 'last_name', 'email', 'level', 'xp_total', 'weight_kg', 'patient_code', 'created_at'],
      order: [['level', 'DESC']],
    });
    res.json(patients);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar pacientes' });
  }
});

// Procurar paciente pelo código de 6 dígitos
router.get('/patients/search', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'Código obrigatório' });

    const patient = await User.findOne({
      where: { patient_code: code, role: 'user' },
      attributes: ['id', 'username', 'first_name', 'last_name', 'email', 'level', 'xp_total', 'weight_kg', 'patient_code'],
    });
    if (!patient) return res.status(404).json({ error: 'Paciente não encontrado' });
    res.json(patient);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao procurar paciente' });
  }
});

// Adicionar paciente pelo código
router.post('/patients/add', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Código obrigatório' });

    const patient = await User.findOne({ where: { patient_code: code, role: 'user' } });
    if (!patient) return res.status(404).json({ error: 'Paciente não encontrado' });

    const existing = await NutritionistPatient.findOne({
      where: { patient_id: patient.id },
    });
    if (existing) {
      if (existing.nutritionist_id === req.user.id) {
        return res.status(409).json({ error: 'Este paciente já está na tua lista' });
      }
      return res.status(409).json({ error: 'Este paciente já está registado noutro nutricionista' });
    }

    await NutritionistPatient.create({
      nutritionist_id: req.user.id,
      patient_id: patient.id,
    });

    res.status(201).json({
      message: 'Paciente adicionado com sucesso',
      patient: {
        id: patient.id,
        username: patient.username,
        first_name: patient.first_name,
        last_name: patient.last_name,
        email: patient.email,
        level: patient.level,
        xp_total: patient.xp_total,
        patient_code: patient.patient_code,
      },
    });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao adicionar paciente' });
  }
});

// Remover paciente
router.delete('/patients/:id', async (req, res) => {
  try {
    const deleted = await NutritionistPatient.destroy({
      where: { nutritionist_id: req.user.id, patient_id: req.params.id },
    });
    if (!deleted) return res.status(404).json({ error: 'Paciente não encontrado na tua lista' });
    res.json({ message: 'Paciente removido' });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao remover paciente' });
  }
});

// Histórico XP de um paciente
router.get('/patients/:id/xp', async (req, res) => {
  try {
    const logs = await XPLog.findAll({
      where: { user_id: req.params.id },
      order: [['logged_at', 'DESC']],
      limit: 50,
    });
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao obter histórico XP' });
  }
});

// Histórico de hidratação de um paciente (últimos 7 dias)
router.get('/patients/:id/hydration', async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const logs = await HydrationLog.findAll({
      where: { user_id: req.params.id, logged_at: { [Op.gte]: since } },
      order: [['logged_at', 'DESC']],
    });
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao obter histórico de hidratação' });
  }
});

// Dashboard agregado de um paciente
router.get('/patients/:id/dashboard', async (req, res) => {
  try {
    const { id } = req.params;
    const days = 14;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [hydration, xpDaily, weightHistory, completions] = await Promise.all([
      // Water per day (last 14 days)
      sequelize.query(`
        SELECT DATE(logged_at) AS day, SUM(amount_ml) AS total_ml
        FROM hydration_logs
        WHERE user_id = :id AND logged_at >= :since
        GROUP BY DATE(logged_at)
        ORDER BY day ASC
      `, { replacements: { id, since }, type: sequelize.QueryTypes.SELECT }),

      // XP per day (last 14 days)
      sequelize.query(`
        SELECT DATE(logged_at) AS day, SUM(xp_gained) AS total_xp
        FROM xp_logs
        WHERE user_id = :id AND logged_at >= :since
        GROUP BY DATE(logged_at)
        ORDER BY day ASC
      `, { replacements: { id, since }, type: sequelize.QueryTypes.SELECT }),

      // Weight history
      sequelize.query(`
        SELECT weight_kg, logged_at
        FROM weight_logs
        WHERE user_id = :id
        ORDER BY logged_at ASC
      `, { replacements: { id }, type: sequelize.QueryTypes.SELECT }),

      // Recipe completions
      sequelize.query(`
        SELECT rc.completed_at, r.name, r.xp_reward
        FROM recipe_completions rc
        JOIN recipes r ON r.id = rc.recipe_id
        WHERE rc.user_id = :id
        ORDER BY rc.completed_at DESC
      `, { replacements: { id }, type: sequelize.QueryTypes.SELECT }),
    ]);

    // Average daily water (last 14 days)
    const totalWater = hydration.reduce((s, r) => s + parseFloat(r.total_ml), 0);
    const avgWater   = hydration.length > 0 ? Math.round(totalWater / days) : 0;

    res.json({ hydration, xpDaily, weightHistory, completions, avgWater });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao obter dashboard', details: e.message });
  }
});

module.exports = router;
