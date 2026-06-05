const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SupportTicket = sequelize.define(
  'SupportTicket',
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
    category: {
      type: DataTypes.ENUM('product', 'order', 'payment', 'account', 'shipping', 'other'),
      allowNull: false
    },
    subject: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('open', 'replied', 'closed'),
      defaultValue: 'open'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium'
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: 'support_tickets',
    indexes: [
      {
        fields: ['user_id', 'status']
      },
      {
        fields: ['user_id', 'created_at']
      },
      {
        fields: ['status', 'created_at']
      }
    ]
  }
);

module.exports = SupportTicket;
