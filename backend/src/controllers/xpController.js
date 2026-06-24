// src/controllers/xpController.js
const User = require('../models/User');
const XPLog = require('../models/XPLog');

// XP rewards table
const XP_REWARDS = {
  drink_water: 10,
  eat_fruit: 25,
  eat_vegetable: 20,
  complete_meal_plan: 50,
  log_hydration_goal: 30,
  add_pantry_item: 5,
  daily_login: 15,
};

// Level thresholds (XP needed to reach each level)
const levelThreshold = (level) => Math.floor(100 * Math.pow(level, 1.5));

const calculateLevel = (totalXP) => {
  let level = 1;
  while (totalXP >= levelThreshold(level)) {
    level++;
  }
  return level;
};

const awardXPToUser = async (userId, xpGained, action, description) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('Utilizador não encontrado');
    err.status = 404;
    throw err;
  }

  const newXPTotal = user.xp_total + xpGained;
  const newLevel = calculateLevel(newXPTotal);
  const leveledUp = newLevel > user.level;

  await user.update({ xp_total: newXPTotal, level: newLevel });

  await XPLog.create({
    user_id: userId,
    action,
    xp_gained: xpGained,
    description: description || action,
  });

  return {
    xp_gained: xpGained,
    xp_total: newXPTotal,
    level: newLevel,
    leveled_up: leveledUp,
    next_level_xp: levelThreshold(newLevel),
    message: leveledUp
      ? `Parabéns! Subiste para o nível ${newLevel}!`
      : `+${xpGained} XP ganhos!`,
  };
};

const awardXP = async (req, res) => {
  try {
    const userId = req.user.id;
    const { action, description } = req.body;

    const xpGained = XP_REWARDS[action];
    if (!xpGained) {
      return res.status(400).json({ error: 'Ação desconhecida para XP' });
    }

    const result = await awardXPToUser(userId, xpGained, action, description);
    res.json(result);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Erro ao atribuir XP' });
  }
};

const getXPStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      attributes: ['level', 'xp_total', 'username'],
    });

    const currentLevelXP = levelThreshold(user.level - 1) || 0;
    const nextLevelXP = levelThreshold(user.level);
    const progressXP = user.xp_total - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    const progressPercent = Math.floor((progressXP / neededXP) * 100);

    res.json({
      level: user.level,
      xp_total: user.xp_total,
      progress_to_next_level: progressPercent,
      xp_to_next_level: neededXP - progressXP,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter status de XP' });
  }
};

const getXPHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const logs = await XPLog.findAll({
      where: { user_id: userId },
      order: [['logged_at', 'DESC']],
      limit: 20,
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter histórico de XP' });
  }
};

module.exports = {
  awardXP,
  awardXPToUser,
  getXPStatus,
  getXPHistory,
  XP_REWARDS,
  calculateLevel,
};
