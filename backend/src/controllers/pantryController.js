// src/controllers/pantryController.js
const PantryItem = require('../models/PantryItem');
const Product = require('../models/Product');

const getItems = async (req, res) => {
  try {
    const items = await PantryItem.findAll({
      where: { user_id: req.user.id },
      order: [['name', 'ASC']],
    });
    const lowStock = items.filter(i => i.quantity <= i.low_stock_threshold);
    res.json({ items, low_stock_alerts: lowStock.map(i => i.name) });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter dispensa' });
  }
};

const addItem = async (req, res) => {
  try {
    const { name, quantity, unit, low_stock_threshold, category, product_id } = req.body;

    let threshold = low_stock_threshold;
    if (product_id) {
      const product = await Product.findByPk(product_id);
      if (!product) return res.status(400).json({ error: 'Ingrediente não encontrado no catálogo' });
      threshold = product.low_stock_threshold;
    } else if (threshold == null || threshold === '') {
      threshold = 100;
    }

    const item = await PantryItem.create({
      user_id: req.user.id, name, quantity, unit,
      low_stock_threshold: threshold,
      category,
      product_id: product_id || null,
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar item' });
  }
};

const updateItem = async (req, res) => {
  try {
    const { quantity, delta } = req.body;

    if (delta !== undefined && delta !== null) {
      const deltaNum = parseFloat(delta);
      if (!Number.isFinite(deltaNum)) {
        return res.status(400).json({ error: 'Alteração de quantidade inválida' });
      }

      const [rows] = await PantryItem.sequelize.query(
        `UPDATE pantry_items
         SET quantity = GREATEST(0, quantity + :delta),
             updated_at = NOW()
         WHERE id = :id AND user_id = :userId
         RETURNING *`,
        {
          replacements: { delta: deltaNum, id: req.params.id, userId: req.user.id },
        },
      );

      const row = rows?.[0];
      if (!row) return res.status(404).json({ error: 'Item não encontrado' });
      return res.json(row);
    }

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ error: 'Quantidade em falta' });
    }

    const qty = parseFloat(quantity);
    if (!Number.isFinite(qty) || qty < 0) {
      return res.status(400).json({ error: 'Quantidade inválida' });
    }

    const item = await PantryItem.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!item) return res.status(404).json({ error: 'Item não encontrado' });

    await item.update({ quantity: qty });
    res.json(item);
  } catch (error) {
    console.error('pantry updateItem:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar item' });
  }
};

const deleteItem = async (req, res) => {
  try {
    const item = await PantryItem.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!item) return res.status(404).json({ error: 'Item não encontrado' });
    await item.destroy();
    res.json({ message: 'Item removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover item' });
  }
};

// Recipe suggestion — moved to recipeDbController (uses all library recipes in BD)
const suggestRecipes = async (_req, res) => {
  res.status(410).json({ error: 'Use GET /api/recipes/suggest' });
};

module.exports = { getItems, addItem, updateItem, deleteItem, suggestRecipes };
