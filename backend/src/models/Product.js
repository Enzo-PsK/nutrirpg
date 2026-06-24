const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:        { type: DataTypes.STRING(100), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  unit:        { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'g' },
  category:    { type: DataTypes.STRING(50), allowNull: true },
  low_stock_threshold: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 100,
  },
}, {
  tableName: 'products',
  timestamps: true,
  updatedAt: false,
  underscored: true,
  createdAt: 'created_at',
});

module.exports = Product;
