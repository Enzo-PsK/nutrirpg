// src/controllers/recipeDbController.js
const sequelize = require('../config/database');
const Recipe = require('../models/Recipe');

// ── helpers ───────────────────────────────────────────────────────────────────

const fetchIngredients = async (recipeIds) => {
  if (!recipeIds.length) return {};
  const rows = await sequelize.query(
    `SELECT ri.recipe_id, ri.quantity, ri.unit,
            p.id AS product_id, p.name AS product_name, p.category AS product_category
     FROM recipe_ingredients ri
     JOIN products p ON p.id = ri.product_id
     WHERE ri.recipe_id IN (:ids)
     ORDER BY p.name`,
    { replacements: { ids: recipeIds }, type: sequelize.QueryTypes.SELECT }
  );
  const map = {};
  rows.forEach(r => {
    if (!map[r.recipe_id]) map[r.recipe_id] = [];
    map[r.recipe_id].push({
      product_id: r.product_id, product_name: r.product_name,
      product_category: r.product_category, quantity: r.quantity, unit: r.unit,
    });
  });
  return map;
};

const isNutri = (req) => ['nutritionist', 'admin'].includes(req.user.role);

const normalizeName = (name) =>
  (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const namesMatch = (pantryName, productName) => {
  const a = normalizeName(pantryName);
  const b = normalizeName(productName);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
};

const pantryHasIngredient = (pantryRows, ingredient) =>
  pantryRows.some((p) => {
    if (p.product_id && ingredient.product_id && p.product_id === ingredient.product_id) {
      return true;
    }
    return namesMatch(p.name, ingredient.product_name);
  });

// ── Library (nutritionist) ────────────────────────────────────────────────────

// GET /api/recipes/library
const getLibrary = async (req, res) => {
  try {
    if (!isNutri(req)) return res.status(403).json({ error: 'Sem permissão' });
    const recipes = await Recipe.findAll({
      where: { nutritionist_id: req.user.id },
      order: [['created_at', 'DESC']],
      raw: true,
    });
    const map = await fetchIngredients(recipes.map(r => r.id));
    res.json(recipes.map(r => ({ ...r, ingredients: map[r.id] || [] })));
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/recipes/library
const createLibraryRecipe = async (req, res) => {
  try {
    if (!isNutri(req)) return res.status(403).json({ error: 'Sem permissão' });
    const { name, description, instructions, xp_reward, ingredients } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

    const recipe = await Recipe.create({
      nutritionist_id: req.user.id,
      patient_id: null,
      name, description, instructions,
      xp_reward: xp_reward || 50,
    });

    if (Array.isArray(ingredients) && ingredients.length > 0) {
      const rows = ingredients
        .filter(i => i.product_id && i.quantity)
        .map(i => `('${recipe.id}','${i.product_id}',${parseFloat(i.quantity)},'${i.unit || 'g'}')`);
      if (rows.length) {
        await sequelize.query(
          `INSERT INTO recipe_ingredients (recipe_id, product_id, quantity, unit) VALUES ${rows.join(',')}`
        );
      }
    }

    const map = await fetchIngredients([recipe.id]);
    res.status(201).json({ ...recipe.toJSON(), ingredients: map[recipe.id] || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// DELETE /api/recipes/library/:id
const deleteLibraryRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.id);
    if (!recipe) return res.status(404).json({ error: 'Receita não encontrada' });
    if (recipe.nutritionist_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão' });
    }
    await recipe.destroy();
    res.json({ message: 'Receita removida' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Assignments ───────────────────────────────────────────────────────────────

// GET /api/recipes/for-patient/:patientId
const getPatientRecipes = async (req, res) => {
  try {
    if (!isNutri(req)) return res.status(403).json({ error: 'Sem permissão' });
    const assignments = await sequelize.query(
      `SELECT r.*, ra.id AS assignment_id
       FROM recipe_assignments ra
       JOIN recipes r ON r.id = ra.recipe_id
       WHERE ra.patient_id = :pid AND ra.assigned_by = :nid
       ORDER BY ra.assigned_at DESC`,
      { replacements: { pid: req.params.patientId, nid: req.user.id }, type: sequelize.QueryTypes.SELECT }
    );
    const map = await fetchIngredients(assignments.map(r => r.id));
    res.json(assignments.map(r => ({ ...r, ingredients: map[r.id] || [] })));
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/recipes/assign  { recipe_id, patient_id }
const assignRecipe = async (req, res) => {
  try {
    if (!isNutri(req)) return res.status(403).json({ error: 'Sem permissão' });
    const { recipe_id, patient_id } = req.body;
    if (!recipe_id || !patient_id) return res.status(400).json({ error: 'recipe_id e patient_id são obrigatórios' });

    await sequelize.query(
      `INSERT INTO recipe_assignments (recipe_id, patient_id, assigned_by)
       VALUES (:rid, :pid, :nid) ON CONFLICT (recipe_id, patient_id) DO NOTHING`,
      { replacements: { rid: recipe_id, pid: patient_id, nid: req.user.id } }
    );
    res.status(201).json({ message: 'Receita atribuída ao paciente' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// DELETE /api/recipes/assign/:assignmentId
const removeAssignment = async (req, res) => {
  try {
    if (!isNutri(req)) return res.status(403).json({ error: 'Sem permissão' });
    await sequelize.query(
      `DELETE FROM recipe_assignments WHERE id = :id AND assigned_by = :nid`,
      { replacements: { id: req.params.assignmentId, nid: req.user.id } }
    );
    res.json({ message: 'Atribuição removida' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/recipes/mine — patient sees assigned recipes
const getMyRecipes = async (req, res) => {
  try {
    const recipes = await sequelize.query(
      `SELECT r.*
       FROM recipe_assignments ra
       JOIN recipes r ON r.id = ra.recipe_id
       WHERE ra.patient_id = :uid
       ORDER BY ra.assigned_at DESC`,
      { replacements: { uid: req.user.id }, type: sequelize.QueryTypes.SELECT }
    );
    const map = await fetchIngredients(recipes.map(r => r.id));
    res.json(recipes.map(r => ({ ...r, ingredients: map[r.id] || [] })));
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/recipes/suggest — match pantry against all recipes in the system
const suggestRecipes = async (req, res) => {
  try {
    const pantryRows = await sequelize.query(
      `SELECT name, product_id FROM pantry_items WHERE user_id = :uid`,
      { replacements: { uid: req.user.id }, type: sequelize.QueryTypes.SELECT }
    );

    if (!pantryRows.length) {
      return res.json([]);
    }

    const recipes = await sequelize.query(
      `SELECT r.*
       FROM recipes r
       WHERE EXISTS (
         SELECT 1 FROM recipe_ingredients ri WHERE ri.recipe_id = r.id
       )
       ORDER BY r.name`,
      { type: sequelize.QueryTypes.SELECT }
    );

    if (!recipes.length) {
      return res.json([]);
    }

    const ingMap = await fetchIngredients(recipes.map((r) => r.id));

    const suggested = recipes
      .map((recipe) => {
        const ingredients = ingMap[recipe.id] || [];
        if (!ingredients.length) return null;

        const matched = ingredients.filter((ing) => pantryHasIngredient(pantryRows, ing));
        if (!matched.length) return null;

        const matchedIds = new Set(matched.map((m) => m.product_id));

        return {
          ...recipe,
          ingredients,
          match_count: matched.length,
          match_percentage: Math.round((matched.length / ingredients.length) * 100),
          matched_ingredients: matched.map((m) => m.product_name),
          missing_ingredients: ingredients
            .filter((ing) => !matchedIds.has(ing.product_id))
            .map((ing) => ing.product_name),
        };
      })
      .filter(Boolean)
      .sort((a, b) => (
        b.match_percentage - a.match_percentage
        || b.match_count - a.match_count
        || a.name.localeCompare(b.name)
      ));

    res.json(suggested);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getLibrary, createLibraryRecipe, deleteLibraryRecipe,
  getPatientRecipes, assignRecipe, removeAssignment,
  getMyRecipes, suggestRecipes,
};
