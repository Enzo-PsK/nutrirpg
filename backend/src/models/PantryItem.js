// src/models/PantryItem.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PantryItem = sequelize.define('PantryItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'g',
  },
  low_stock_threshold: {
    type: DataTypes.FLOAT,
    defaultValue: 100,
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'pantry_items',
  timestamps: true,
  underscored: true,
});

module.exports = PantryItem;
