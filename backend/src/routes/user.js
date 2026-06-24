// src/routes/user.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/auth');
const { validateWeight, validateChangePassword } = require('../middleware/security');
const sequelize = require('../config/database');
const User = require('../models/User');
const NutritionistPatient = require('../models/NutritionistPatient');
const Recipe = require('../models/Recipe');
const { awardXPToUser } = require('../controllers/xpController');
const router = express.Router();
router.use(authenticateToken);
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
    });
    const payload = user.toJSON();

    if (user.role === 'user') {
      const link = await NutritionistPatient.findOne({
        where: { patient_id: user.id },
      });
      if (link) {
        const nutritionist = await User.findByPk(link.nutritionist_id, {
          attributes: ['id', 'username', 'first_name', 'last_name', 'email'],
        });
        if (nutritionist) {
          payload.nutritionist = nutritionist.toJSON();
        }
      }
    }

    res.json(payload);
  } catch (e) { res.status(500).json({ error: 'Erro ao obter perfil' }); }
});
router.put('/profile', async (req, res) => {
  try {
    const { username, weight_kg } = req.body;
    const user = await User.findByPk(req.user.id);
    await user.update({ username, weight_kg });
    res.json({ message: 'Perfil atualizado', user });
  } catch (e) { res.status(500).json({ error: 'Erro ao atualizar perfil' }); }
});
// POST /api/user/change-password
router.post('/change-password', validateChangePassword, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Senha atual e nova senha sao obrigatorias' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
    }
    const user = await User.findByPk(req.user.id);
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }
    const password_hash = await bcrypt.hash(new_password, 10);
    await user.update({ password_hash });
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao alterar senha' });
  }
});

// POST /api/user/weight — log a new weight entry
router.post('/weight', validateWeight, async (req, res) => {
  try {
    const { weight_kg } = req.body;
    if (!weight_kg || isNaN(weight_kg)) {
      return res.status(400).json({ error: 'Peso inválido' });
    }
    // update current weight on user
    await User.update({ weight_kg }, { where: { id: req.user.id } });
    // insert into weight_logs
    await sequelize.query(
      'INSERT INTO weight_logs (user_id, weight_kg) VALUES (:uid, :w)',
      { replacements: { uid: req.user.id, w: parseFloat(weight_kg) } }
    );
    res.json({ message: 'Peso registado' });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao registar peso' });
  }
});

// POST /api/user/complete-recipe/:recipeId — regista conclusão + atribui XP (repetível)
router.post('/complete-recipe/:recipeId', async (req, res) => {
  try {
    const { recipeId } = req.params;

    const recipe = await Recipe.findByPk(recipeId);
    if (!recipe) {
      return res.status(404).json({ error: 'Receita não encontrada' });
    }

    const xpGained = recipe.xp_reward ?? 50;

    await sequelize.query(
      'INSERT INTO recipe_completions (user_id, recipe_id) VALUES (:uid, :rid)',
      { replacements: { uid: req.user.id, rid: recipeId } }
    );

    const xpResult = await awardXPToUser(
      req.user.id,
      xpGained,
      'complete_recipe',
      `Cozinhei: ${recipe.name}`
    );

    res.json({
      message: 'Receita concluída!',
      recipe_name: recipe.name,
      xp_reward: xpGained,
      ...xpResult,
    });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao concluir receita' });
  }
});

module.exports = router;
