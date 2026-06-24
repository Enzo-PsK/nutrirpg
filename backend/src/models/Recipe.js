const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Recipe = sequelize.define('Recipe', {
  id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nutritionist_id:  { type: DataTypes.UUID, allowNull: false },
  patient_id:       { type: DataTypes.UUID, allowNull: true },
  name:             { type: DataTypes.STRING(150), allowNull: false },
  description:      { type: DataTypes.TEXT, allowNull: true },
  instructions:     { type: DataTypes.TEXT, allowNull: true },
  xp_reward:        { type: DataTypes.INTEGER, defaultValue: 50 },
}, {
  tableName: 'recipes',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Recipe;
