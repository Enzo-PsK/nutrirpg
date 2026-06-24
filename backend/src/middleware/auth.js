// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'nutrirpg_secret', async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }

    try {
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'role', 'disabled'],
      });
      if (!user) {
        return res.status(403).json({ error: 'Utilizador não encontrado' });
      }
      if (user.disabled) {
        return res.status(403).json({ error: 'Conta desactivada' });
      }
      req.user = { id: user.id, role: user.role };
      next();
    } catch (e) {
      res.status(500).json({ error: 'Erro de autenticação' });
    }
  });
};

module.exports = { authenticateToken };
