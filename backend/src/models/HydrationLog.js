// src/models/HydrationLog.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HydrationLog = sequelize.define('HydrationLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  amount_ml: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  logged_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'hydration_logs',
  timestamps: false,
});

module.exports = HydrationLog;
