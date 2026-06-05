const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GiftCardUsage = sequelize.define(
  'GiftCardUsage',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    gift_card_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    balance_before: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    balance_after: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  },
  { tableName: 'gift_card_usages' }
);

module.exports = GiftCardUsage;
