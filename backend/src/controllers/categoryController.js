// src/controllers/categoryController.js
const Category = require('../models/Category');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });

    const [category, created] = await Category.findOrCreate({
      where: { name: name.trim() },
      defaults: { name: name.trim() },
    });

    if (!created) return res.status(409).json({ error: 'Categoria já existe' });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) return res.status(404).json({ error: 'Categoria não encontrada' });

    // clear the category from any products that use it
    await sequelize.query(
      'UPDATE products SET category = NULL WHERE category = :name',
      { replacements: { name: category.name } }
    );

    await category.destroy();
    res.json({ message: 'Categoria eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getCategories, createCategory, deleteCategory };
