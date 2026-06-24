// src/controllers/hydrationController.js
const { Op } = require('sequelize');
const HydrationLog = require('../models/HydrationLog');
const User = require('../models/User');

// Daily goal: 35ml per kg of body weight, minimum 2000ml
const calculateDailyGoal = (weight_kg) => {
  if (!weight_kg) return 2000;
  return Math.max(Math.round(weight_kg * 35), 2000);
};

const logHydration = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount_ml } = req.body;

    if (!amount_ml || amount_ml <= 0) {
      return res.status(400).json({ error: 'Quantidade inválida' });
    }

    const log = await HydrationLog.create({
      user_id: userId,
      amount_ml,
    });

    const todayTotal = await getDailyTotal(userId);
    const user = await User.findByPk(userId);
    const dailyGoal = calculateDailyGoal(user.weight_kg);
    const goalReached = todayTotal >= dailyGoal;

    res.status(201).json({
      log,
      today_total_ml: todayTotal,
      daily_goal_ml: dailyGoal,
      goal_reached: goalReached,
      percentage: Math.min(Math.round((todayTotal / dailyGoal) * 100), 100),
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registar hidratação' });
  }
};

const getDailyTotal = async (userId) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const logs = await HydrationLog.findAll({
    where: {
      user_id: userId,
      logged_at: { [Op.gte]: startOfDay },
    },
  });

  return logs.reduce((sum, log) => sum + log.amount_ml, 0);
};

const getTodayStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    const todayTotal = await getDailyTotal(userId);
    const dailyGoal = calculateDailyGoal(user.weight_kg);

    res.json({
      today_total_ml: todayTotal,
      daily_goal_ml: dailyGoal,
      goal_reached: todayTotal >= dailyGoal,
      percentage: Math.min(Math.round((todayTotal / dailyGoal) * 100), 100),
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter estado de hidratação' });
  }
};

module.exports = { logHydration, getTodayStatus, calculateDailyGoal };
