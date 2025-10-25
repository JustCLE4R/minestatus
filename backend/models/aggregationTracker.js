'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AggregationTracker extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  AggregationTracker.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tableName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'table_name'
    },
    lastAggregatedAt: {
      type: DataTypes.DATE,
      field: 'last_aggregated_at',
    }
  }, {
    sequelize,
    modelName: 'AggregationTracker',
    tableName: 'aggregation_tracker',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return AggregationTracker;
};