'use strict';

module.exports = (sequelize, DataTypes) => {
  const BlockBreak = sequelize.define('BlockBreak', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    serverName: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'server_name'
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'date',
    },
    world: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'world'
    },
    playerName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'player_name'
    },
    block: {
      type: DataTypes.STRING(40),
      allowNull: true,
      field: 'block'
    },
    x: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'x'
    },
    y: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'y'
    },
    z: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'z'
    }
  }, {
    modelName: 'BlockBreak',
    tableName: 'block_break',
    timestamps: false,
  });

  BlockBreak.associate = function(models) {
    // Define associations here if needed
  };

  return BlockBreak;
};