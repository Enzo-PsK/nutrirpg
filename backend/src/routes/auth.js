// src/routes/auth.js
const express = require('express');
const { register, login, registerNutritionist } = require('../controllers/authController');
const { loginLimiter, registerLimiter, validateLogin, validateRegister } = require('../middleware/security');

const router = express.Router();

router.post('/login',                 loginLimiter,    validateLogin,    login);
router.post('/register',              registerLimiter, validateRegister, register);
router.post('/register-nutritionist', registerLimiter, validateRegister, registerNutritionist);

module.exports = router;
