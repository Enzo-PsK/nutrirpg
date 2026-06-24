// src/models/NutritionistPatient.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NutritionistPatient = sequelize.define('NutritionistPatient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nutritionist_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  patient_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'nutritionist_patients',
  timestamps: false,
});

module.exports = NutritionistPatient;
