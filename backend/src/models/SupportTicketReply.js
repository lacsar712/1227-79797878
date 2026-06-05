const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SupportTicketReply = sequelize.define(
  'SupportTicketReply',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ticket_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'support_tickets',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    is_staff: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    staff_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  },
  {
    tableName: 'support_ticket_replies',
    indexes: [
      {
        fields: ['ticket_id', 'created_at']
      }
    ]
  }
);

module.exports = SupportTicketReply;
