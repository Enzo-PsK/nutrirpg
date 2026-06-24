// src/routes/pantry.js
const express = require('express');
const { getItems, addItem, updateItem, deleteItem } = require('../controllers/pantryController');
const { suggestRecipes } = require('../controllers/recipeDbController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();
router.use(authenticateToken);
router.get('/', getItems);
router.post('/', addItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);
router.get('/suggest-recipes', suggestRecipes);
module.exports = router;
