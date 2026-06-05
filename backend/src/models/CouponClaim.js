const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CouponClaim = sequelize.define(
  'CouponClaim',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    coupon_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('unused', 'used', 'expired'),
      defaultValue: 'unused'
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    used_order_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    expire_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
  { tableName: 'coupon_claims' }
);

module.exports = CouponClaim;
