// Portal de administração da plataforma (role admin)
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const User = require('../models/User');

const PUBLIC_ATTRS = [
  'id', 'username', 'first_name', 'last_name', 'email', 'role',
  'disabled', 'patient_code', 'level', 'xp_total', 'created_at',
];

const getDashboard = async (req, res) => {
  try {
    const [patientCount, nutritionistCount] = await Promise.all([
      User.count({ where: { role: 'user' } }),
      User.count({ where: { role: 'nutritionist' } }),
    ]);

    const topNutritionists = await sequelize.query(`
      SELECT u.id, u.username, u.first_name, u.last_name, u.email, u.disabled,
             COUNT(np.patient_id)::int AS patient_count
      FROM users u
      LEFT JOIN nutritionist_patients np ON np.nutritionist_id = u.id
      WHERE u.role = 'nutritionist'
      GROUP BY u.id
      ORDER BY patient_count DESC, u.username ASC
      LIMIT 10
    `, { type: sequelize.QueryTypes.SELECT });

    res.json({ patientCount, nutritionistCount, topNutritionists });
  } catch (e) {
    console.error('platformAdmin getDashboard:', e.message);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
};

const listUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const where = { role: { [Op.in]: ['user', 'nutritionist'] } };
    if (role === 'user' || role === 'nutritionist') where.role = role;

    const users = await User.findAll({
      where,
      attributes: PUBLIC_ATTRS,
      order: [['role', 'ASC'], ['username', 'ASC']],
    });

    const nutriIds = users.filter((u) => u.role === 'nutritionist').map((u) => u.id);
    let countsByNutri = {};
    if (nutriIds.length) {
      const rows = await sequelize.query(`
        SELECT nutritionist_id, COUNT(patient_id)::int AS patient_count
        FROM nutritionist_patients
        WHERE nutritionist_id IN (:ids)
        GROUP BY nutritionist_id
      `, {
        replacements: { ids: nutriIds },
        type: sequelize.QueryTypes.SELECT,
      });
      countsByNutri = Object.fromEntries(rows.map((r) => [r.nutritionist_id, r.patient_count]));
    }

    res.json(users.map((u) => ({
      ...u.toJSON(),
      patient_count: u.role === 'nutritionist' ? (countsByNutri[u.id] || 0) : null,
    })));
  } catch (e) {
    console.error('platformAdmin listUsers:', e.message);
    res.status(500).json({ error: 'Erro ao listar utilizadores' });
  }
};

const setDisabled = async (req, res) => {
  try {
    const target = await User.findByPk(req.params.id);
    if (!target) return res.status(404).json({ error: 'Utilizador não encontrado' });
    if (target.role === 'admin') {
      return res.status(403).json({ error: 'Não é possível alterar contas de administrador' });
    }
    if (target.id === req.user.id) {
      return res.status(403).json({ error: 'Não podes alterar a tua própria conta' });
    }

    const disabled = !!req.body.disabled;
    await target.update({ disabled });

    res.json({
      message: disabled ? 'Conta desactivada' : 'Conta activada',
      user: {
        id: target.id,
        username: target.username,
        role: target.role,
        disabled: target.disabled,
      },
    });
  } catch (e) {
    console.error('platformAdmin setDisabled:', e.message);
    res.status(500).json({ error: 'Erro ao actualizar conta' });
  }
};

const deleteUserGdpr = async (req, res) => {
  const targetId = req.params.id;

  try {
    const target = await User.findByPk(targetId);
    if (!target) return res.status(404).json({ error: 'Utilizador não encontrado' });
    if (target.role === 'admin') {
      return res.status(403).json({ error: 'Não é possível eliminar contas de administrador' });
    }
    if (target.id === req.user.id) {
      return res.status(403).json({ error: 'Não podes eliminar a tua própria conta' });
    }

    const t = await sequelize.transaction();
    try {
      await sequelize.query(
        `DELETE FROM recipe_assignments WHERE assigned_by = :id OR patient_id = :id`,
        { replacements: { id: targetId }, transaction: t },
      );
      await target.destroy({ transaction: t });
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

    res.json({ message: 'Todos os registos do utilizador foram eliminados (GDPR)' });
  } catch (e) {
    console.error('platformAdmin deleteUserGdpr:', e.message);
    res.status(500).json({ error: 'Erro ao eliminar registos do utilizador' });
  }
};

module.exports = {
  getDashboard,
  listUsers,
  setDisabled,
  deleteUserGdpr,
};
