const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Coupon = sequelize.define(
  'Coupon',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('fixed', 'percent'),
      defaultValue: 'fixed'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    min_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    total_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    claimed_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    per_user_limit: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    start_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    valid_days: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'expired'),
      defaultValue: 'active'
    }
  },
  { tableName: 'coupons' }
);

module.exports = Coupon;
