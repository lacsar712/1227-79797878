const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LiveStreamProduct = sequelize.define(
  'LiveStreamProduct',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    live_stream_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_highlight: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    live_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    }
  },
  { tableName: 'live_stream_products' }
);

module.exports = LiveStreamProduct;
