// src/routes/xp.js
const express = require('express');
const { awardXP, getXPStatus, getXPHistory } = require('../controllers/xpController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();
router.use(authenticateToken);
router.post('/award', awardXP);
router.get('/status', getXPStatus);
router.get('/history', getXPHistory);
module.exports = router;
