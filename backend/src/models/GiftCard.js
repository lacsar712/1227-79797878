const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GiftCard = sequelize.define(
  'GiftCard',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    card_no: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('unused', 'bound', 'used'),
      defaultValue: 'unused'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    bound_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expire_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  { tableName: 'gift_cards' }
);

module.exports = GiftCard;
