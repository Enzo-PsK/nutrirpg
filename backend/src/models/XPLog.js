// src/models/XPLog.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const XPLog = sequelize.define('XPLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  xp_gained: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  logged_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'xp_logs',
  timestamps: false,
});

module.exports = XPLog;
