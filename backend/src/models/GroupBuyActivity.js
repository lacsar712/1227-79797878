const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GroupBuyActivity = sequelize.define(
  'GroupBuyActivity',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    product_id: {
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
    duration_hours: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 24
    },
    start_time: {
      type: DataTypes.DATE
    },
    end_time: {
      type: DataTypes.DATE
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  },
  { tableName: 'group_buy_activities' }
);

module.exports = GroupBuyActivity;
