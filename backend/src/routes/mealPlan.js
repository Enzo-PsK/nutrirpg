// src/routes/mealPlan.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const c = require('../controllers/mealPlanController');

const router = express.Router();
router.use(authenticateToken);

router.get('/mine',                              c.getMyPlan);           // patient
router.get('/for-patient/:patientId',            c.getPlanForPatient);   // nutritionist
router.post('/for-patient/:patientId/meal',      c.addMeal);             // nutritionist
router.post('/for-patient/:patientId/template',  c.applyTemplate);       // nutritionist
router.delete('/meal/:mealId',                   c.deleteMeal);          // nutritionist
router.post('/meal/:mealId/item',                c.addItem);             // nutritionist
router.delete('/item/:itemId',                   c.deleteItem);          // nutritionist

module.exports = router;
