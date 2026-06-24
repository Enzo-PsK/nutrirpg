// src/routes/recipe.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  getLibrary, createLibraryRecipe, deleteLibraryRecipe,
  getPatientRecipes, assignRecipe, removeAssignment,
  getMyRecipes, suggestRecipes,
} = require('../controllers/recipeDbController');

const router = express.Router();
router.use(authenticateToken);

// Patient
router.get('/suggest',                  suggestRecipes);
router.get('/mine',                     getMyRecipes);

// Nutritionist — library (global recipes)
router.get('/library',                  getLibrary);
router.post('/library',                 createLibraryRecipe);
router.delete('/library/:id',           deleteLibraryRecipe);

// Nutritionist — patient assignments
router.get('/for-patient/:patientId',   getPatientRecipes);
router.post('/assign',                  assignRecipe);
router.delete('/assign/:assignmentId',  removeAssignment);

module.exports = router;
