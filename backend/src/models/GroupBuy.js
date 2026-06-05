const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GroupBuy = sequelize.define(
  'GroupBuy',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    group_buy_activity_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    leader_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    group_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    min_people: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2
    },
    current_people: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    expire_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed', 'expired'),
      defaultValue: 'pending'
    }
  },
  { tableName: 'group_buys' }
);

module.exports = GroupBuy;
