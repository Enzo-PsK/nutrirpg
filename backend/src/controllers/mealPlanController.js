// src/controllers/mealPlanController.js
const sequelize = require('../config/database');

const isNutri = (req) => ['nutritionist', 'admin'].includes(req.user.role);

// ── helpers ───────────────────────────────────────────────────────────────────

const fetchPlanForPatient = async (patientId, nutriId) => {
  const meals = await sequelize.query(
    `SELECT * FROM meals
     WHERE patient_id = :pid AND nutritionist_id = :nid
     ORDER BY meal_time ASC NULLS LAST, order_index ASC, created_at ASC`,
    { replacements: { pid: patientId, nid: nutriId }, type: sequelize.QueryTypes.SELECT }
  );
  if (!meals.length) return [];

  const items = await sequelize.query(
    `SELECT * FROM meal_items
     WHERE meal_id IN (:ids)
     ORDER BY order_index ASC, created_at ASC`,
    { replacements: { ids: meals.map(m => m.id) }, type: sequelize.QueryTypes.SELECT }
  );

  const itemsMap = {};
  items.forEach(i => {
    if (!itemsMap[i.meal_id]) itemsMap[i.meal_id] = [];
    itemsMap[i.meal_id].push(i);
  });

  return meals.map(m => ({ ...m, items: itemsMap[m.id] || [] }));
};

// ── GET /api/meal-plan/for-patient/:patientId  (nutritionist) ─────────────────
exports.getPlanForPatient = async (req, res) => {
  if (!isNutri(req)) return res.status(403).json({ error: 'Sem permissão' });
  try {
    const plan = await fetchPlanForPatient(req.params.patientId, req.user.id);
    res.json(plan);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── GET /api/meal-plan/mine  (patient) ────────────────────────────────────────
exports.getMyPlan = async (req, res) => {
  try {
    const meals = await sequelize.query(
      `SELECT * FROM meals WHERE patient_id = :uid ORDER BY meal_time ASC NULLS LAST, order_index ASC, created_at ASC`,
      { replacements: { uid: req.user.id }, type: sequelize.QueryTypes.SELECT }
    );
    if (!meals.length) return res.json([]);

    const items = await sequelize.query(
      `SELECT * FROM meal_items WHERE meal_id IN (:ids) ORDER BY order_index ASC, created_at ASC`,
      { replacements: { ids: meals.map(m => m.id) }, type: sequelize.QueryTypes.SELECT }
    );
    const map = {};
    items.forEach(i => {
      if (!map[i.meal_id]) map[i.meal_id] = [];
      map[i.meal_id].push(i);
    });
    res.json(meals.map(m => ({ ...m, items: map[m.id] || [] })));
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── POST /api/meal-plan/for-patient/:patientId/meal  (nutritionist) ───────────
exports.addMeal = async (req, res) => {
  if (!isNutri(req)) return res.status(403).json({ error: 'Sem permissão' });
  try {
    const { name, meal_time, order_index } = req.body;
    if (!name)      return res.status(400).json({ error: 'Nome da refeição é obrigatório' });
    if (!meal_time) return res.status(400).json({ error: 'Horário é obrigatório' });

    const [rows] = await sequelize.query(
      `INSERT INTO meals (patient_id, nutritionist_id, name, meal_time, order_index)
       VALUES (:pid, :nid, :name, :time, :ord)
       RETURNING *`,
      { replacements: {
          pid: req.params.patientId, nid: req.user.id,
          name, time: meal_time, ord: order_index ?? 0,
        } }
    );
    res.status(201).json({ ...rows[0], items: [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── DELETE /api/meal-plan/meal/:mealId  (nutritionist) ────────────────────────
exports.deleteMeal = async (req, res) => {
  if (!isNutri(req)) return res.status(403).json({ error: 'Sem permissão' });
  try {
    await sequelize.query(
      `DELETE FROM meals WHERE id = :id AND nutritionist_id = :nid`,
      { replacements: { id: req.params.mealId, nid: req.user.id } }
    );
    res.json({ message: 'Refeição removida' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── POST /api/meal-plan/meal/:mealId/item  (nutritionist) ─────────────────────
exports.addItem = async (req, res) => {
  if (!isNutri(req)) return res.status(403).json({ error: 'Sem permissão' });
  try {
    const { description, order_index } = req.body;
    if (!description) return res.status(400).json({ error: 'Descrição é obrigatória' });

    const [rows] = await sequelize.query(
      `INSERT INTO meal_items (meal_id, description, order_index)
       VALUES (:mid, :desc, :ord) RETURNING *`,
      { replacements: { mid: req.params.mealId, desc: description, ord: order_index ?? 0 } }
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── POST /api/meal-plan/for-patient/:patientId/template  (nutritionist) ───────
const TEMPLATE = [
  { name: 'Pequeno Almoço', meal_time: '08:00', items: ['2 ovos mexidos', '1 café descafeinado'] },
  { name: 'Lanche da Manhã', meal_time: '11:00', items: ['1 banana'] },
  { name: 'Almoço',          meal_time: '12:00', items: ['Massa carbonara', '1 cola zero ou pedras'] },
  { name: 'Lanche da Tarde', meal_time: '16:00', items: ['2 bolachas de aveia'] },
  { name: 'Jantar',          meal_time: '20:00', items: ['Macarrão com atum'] },
];

exports.applyTemplate = async (req, res) => {
  if (!isNutri(req)) return res.status(403).json({ error: 'Sem permissão' });
  try {
    for (let i = 0; i < TEMPLATE.length; i++) {
      const t = TEMPLATE[i];
      const [rows] = await sequelize.query(
        `INSERT INTO meals (patient_id, nutritionist_id, name, meal_time, order_index)
         VALUES (:pid, :nid, :name, :time, :ord) RETURNING *`,
        { replacements: { pid: req.params.patientId, nid: req.user.id, name: t.name, time: t.meal_time, ord: i } }
      );
      const mealId = rows[0].id;
      for (let j = 0; j < t.items.length; j++) {
        await sequelize.query(
          `INSERT INTO meal_items (meal_id, description, order_index) VALUES (:mid, :desc, :ord)`,
          { replacements: { mid: mealId, desc: t.items[j], ord: j } }
        );
      }
    }
    const plan = await fetchPlanForPatient(req.params.patientId, req.user.id);
    res.status(201).json(plan);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── DELETE /api/meal-plan/item/:itemId  (nutritionist) ────────────────────────
exports.deleteItem = async (req, res) => {
  if (!isNutri(req)) return res.status(403).json({ error: 'Sem permissão' });
  try {
    await sequelize.query(
      `DELETE FROM meal_items WHERE id = :id`, { replacements: { id: req.params.itemId } }
    );
    res.json({ message: 'Item removido' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
