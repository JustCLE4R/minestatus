'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Skill extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Skill.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  
  Skill.init({
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unsigned: true
    },
    taming: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unsigned: true,
      defaultValue: 0
    },
    mining: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unsigned: true,
      defaultValue: 0
    },
    woodcutting: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unsigned: true,
      defaultValue: 0
    },
    repair: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unsigned: true,
      defaultValue: 0
    },
    unarmed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unsigned: true,
      defaultValue: 0
    },
    herbalism: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unsigned: true,
      defaultValue: 0
    },
    excavation: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unsigned: true,
      defaultValue: 0
    },
    archery: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unsigned: true,
      defaultValue: 0
    },
    swords: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unsigned: true,
      defaultValue: 0
    },
    axes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unsigned: true,
      defaultValue: 0
    },
    acrobatics: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unsigned: true,
      defaultValue: 0
    },
    fishing: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unsigned: true,
      defaultValue: 0
    },
    alchemy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unsigned: true,
      defaultValue: 0
    },
    crossbows: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unsigned: true,
      defaultValue: 0
    },
    tridents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unsigned: true,
      defaultValue: 0
    },
    maces: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unsigned: true,
      defaultValue: 0
    },
    total: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unsigned: true,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Skill',
    tableName: 'mcmmo_skills',
    timestamps: false, // No created_at/updated_at since not in original schema
    underscored: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  });

  // Make model read-only by overriding CUD operations
  Skill.create = function() {
    throw new Error('Skill model is read-only. Data is populated by external service.');
  };
  
  Skill.bulkCreate = function() {
    throw new Error('Skill model is read-only. Data is populated by external service.');
  };
  
  Skill.update = function() {
    throw new Error('Skill model is read-only. Data is populated by external service.');
  };
  
  Skill.destroy = function() {
    throw new Error('Skill model is read-only. Data is populated by external service.');
  };
  
  Skill.bulkDestroy = function() {
    throw new Error('Skill model is read-only. Data is populated by external service.');
  };

  // Override instance methods as well
  Skill.prototype.save = function() {
    throw new Error('Skill model is read-only. Data is populated by external service.');
  };
  
  Skill.prototype.update = function() {
    throw new Error('Skill model is read-only. Data is populated by external service.');
  };
  
  Skill.prototype.destroy = function() {
    throw new Error('Skill model is read-only. Data is populated by external service.');
  };
  
  return Skill;
};