"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PlayerBlockStats extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  PlayerBlockStats.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      playerName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: "player_name",
      },
      blockType: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: "block_type",
      },
      actionType: {
        type: DataTypes.ENUM("break", "place"),
        allowNull: false,
        field: "action_type"
      },
      count: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
    },
    {
      sequelize,
      modelName: "PlayerBlockStats",
      tableName: "player_block_stats",
      timestamps: true,
      indexes: [
        { fields: ["player_name"] },
        { fields: ["block_type"] },
        { fields: ["action_type"] },
        { unique: true, fields: ["player_name", "block_type", "action_type"] },
      ],
    }
  );
  return PlayerBlockStats;
};
