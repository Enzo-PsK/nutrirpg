const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  getDashboard,
  listUsers,
  setDisabled,
  deleteUserGdpr,
} = require('../controllers/platformAdminController');

const router = express.Router();

const requirePlatformAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso reservado a administradores' });
  }
  next();
};

router.use(authenticateToken, requirePlatformAdmin);

router.get('/dashboard', getDashboard);
router.get('/users', listUsers);
router.patch('/users/:id/disabled', setDisabled);
router.delete('/users/:id/gdpr', deleteUserGdpr);

module.exports = router;
