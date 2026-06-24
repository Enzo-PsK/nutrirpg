// src/routes/hydration.js
const express = require('express');
const { logHydration, getTodayStatus } = require('../controllers/hydrationController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();
router.use(authenticateToken);
router.post('/log', logHydration);
router.get('/today', getTodayStatus);
module.exports = router;
