'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasOne(models.Skill, { foreignKey: 'user_id' });
    }
  }
  
  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    user: {
      type: DataTypes.STRING(40),
      allowNull: true,
      charset: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci'
    },
    uuid: {
      type: DataTypes.STRING(36),
      allowNull: true,
      charset: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci'
    },
    lastlogin: {
      type: DataTypes.BIGINT,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'mcmmo_users',
    timestamps: false, // No created_at/updated_at since not in original schema
    underscored: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  });

  // Make model read-only by overriding CUD operations
  User.create = function() {
    throw new Error('User model is read-only. Data is populated by external service.');
  };
  
  User.bulkCreate = function() {
    throw new Error('User model is read-only. Data is populated by external service.');
  };
  
  User.update = function() {
    throw new Error('User model is read-only. Data is populated by external service.');
  };
  
  User.destroy = function() {
    throw new Error('User model is read-only. Data is populated by external service.');
  };
  
  User.bulkDestroy = function() {
    throw new Error('User model is read-only. Data is populated by external service.');
  };

  // Override instance methods as well
  User.prototype.save = function() {
    throw new Error('User model is read-only. Data is populated by external service.');
  };
  
  User.prototype.update = function() {
    throw new Error('User model is read-only. Data is populated by external service.');
  };
  
  User.prototype.destroy = function() {
    throw new Error('User model is read-only. Data is populated by external service.');
  };
  
  return User;
};