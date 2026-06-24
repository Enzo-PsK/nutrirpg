// src/models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  first_name: {
    type: DataTypes.STRING(80),
    allowNull: true,
  },
  last_name: {
    type: DataTypes.STRING(80),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  weight_kg: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  xp_total: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  role: {
    type: DataTypes.ENUM('user', 'nutritionist', 'admin'),
    defaultValue: 'user',
  },
  patient_code: {
    type: DataTypes.CHAR(6),
    allowNull: true,
    unique: true,
  },
  disabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

module.exports = User;
