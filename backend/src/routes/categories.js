// src/routes/categories.js
const express = require('express');
const router  = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateCategory } = require('../middleware/security');
const { getCategories, createCategory, deleteCategory } = require('../controllers/categoryController');

router.use(authenticateToken);

router.get('/',       getCategories);
router.post('/',      validateCategory, createCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
