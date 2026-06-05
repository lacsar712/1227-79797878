const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Wishlist = sequelize.define(
  'Wishlist',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    share_code: {
      type: DataTypes.STRING(16),
      allowNull: true,
      unique: true
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    cover_image: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  },
  { tableName: 'wishlists' }
);

module.exports = Wishlist;
