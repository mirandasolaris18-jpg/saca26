// models/Usuario.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // tu conexión Sequelize

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  nombre_completo: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  cargo: {
    type: DataTypes.ENUM('Sacerdote', 'Secretaria', 'Obispo', 'Colaborador'),
    allowNull: false
  },
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Roles',
      key: 'id'
    }
  },
  activo: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  },
  creado_por: {
    type: DataTypes.STRING(100),
    defaultValue: 'sistema'
  },
  creado_en: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  actualizado_en: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'usuarios',
  timestamps: false // ya tienes tus propios campos de tiempo
});

module.exports = Usuario;
