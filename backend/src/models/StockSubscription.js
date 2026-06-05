const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockSubscription = sequelize.define(
  'StockSubscription',
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
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'notified', 'cancelled'),
      defaultValue: 'active'
    },
    notified_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: 'stock_subscriptions',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'product_id', 'status'],
        where: {
          status: 'active'
        }
      }
    ]
  }
);

module.exports = StockSubscription;
