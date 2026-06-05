const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GroupBuyMember = sequelize.define(
  'GroupBuyMember',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    group_buy_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    order_id: {
      type: DataTypes.INTEGER
    },
    is_leader: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('joined', 'order_pending', 'order_created', 'paid', 'cancelled'),
      defaultValue: 'joined'
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  { tableName: 'group_buy_members' }
);

module.exports = GroupBuyMember;
