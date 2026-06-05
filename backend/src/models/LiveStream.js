const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LiveStream = sequelize.define(
  'LiveStream',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    cover_image: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('live', 'upcoming', 'ended'),
      allowNull: false,
      defaultValue: 'upcoming'
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    streamer_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    streamer_avatar: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    viewer_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  { tableName: 'live_streams' }
);

module.exports = LiveStream;
