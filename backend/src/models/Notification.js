const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('stock_arrival', 'order', 'system', 'promotion'),
      defaultValue: 'system'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    related_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    related_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    extra: {
      type: DataTypes.JSON,
      allowNull: true
    }
  },
  {
    tableName: 'notifications',
    indexes: [
      {
        fields: ['user_id', 'is_read']
      },
      {
        fields: ['user_id', 'created_at']
      }
    ]
  }
);

module.exports = Notification;
