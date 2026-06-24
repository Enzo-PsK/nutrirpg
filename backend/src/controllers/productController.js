// src/controllers/productController.js
const Product = require('../models/Product');

function parseThreshold(value) {
  const n = parseFloat(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

// GET /api/products — list all (any authenticated user)
const getProducts = async (req, res) => {
  try {
    const { category } = req.query;
    const where = category ? { category } : {};
    const products = await Product.findAll({
      where,
      order: [['name', 'ASC']],
    });
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// POST /api/products — create (nutritionist or admin)
const createProduct = async (req, res) => {
  try {
    if (!['nutritionist', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Sem permissão' });
    }
    const { name, description, unit, category, low_stock_threshold } = req.body;
    if (!name || !unit) {
      return res.status(400).json({ error: 'Nome e unidade são obrigatórios' });
    }
    const threshold = parseThreshold(low_stock_threshold);
    if (threshold == null) {
      return res.status(400).json({ error: 'Stock mínimo inválido (deve ser um número positivo)' });
    }
    const product = await Product.create({
      name, description, unit, category, low_stock_threshold: threshold,
    });
    res.status(201).json(product);
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Ingrediente com esse nome já existe' });
    }
    res.status(500).json({ error: e.message });
  }
};

// PUT /api/products/:id — update (nutritionist or admin)
const updateProduct = async (req, res) => {
  try {
    if (!['nutritionist', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Sem permissão' });
    }
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Ingrediente não encontrado' });
    const { name, description, unit, category, low_stock_threshold } = req.body;
    const updates = { name, description, unit, category };
    if (low_stock_threshold !== undefined) {
      const threshold = parseThreshold(low_stock_threshold);
      if (threshold == null) {
        return res.status(400).json({ error: 'Stock mínimo inválido (deve ser um número positivo)' });
      }
      updates.low_stock_threshold = threshold;
    }
    await product.update(updates);
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// DELETE /api/products/:id — delete (nutritionist or admin)
const deleteProduct = async (req, res) => {
  try {
    if (!['nutritionist', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Sem permissão' });
    }
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Ingrediente não encontrado' });
    await product.destroy();
    res.json({ message: 'Ingrediente removido' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct };
