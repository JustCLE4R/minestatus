'use strict';

module.exports = (sequelize, DataTypes) => {
  const PlayerSession = sequelize.define('PlayerSession', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    playerName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'player_name'
    },
    sessionStart: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'session_start'
    },
    sessionEnd: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'session_end'
    },
    duration: {
      type: DataTypes.VIRTUAL, // Make it truly virtual
      get() {
        const start = this.getDataValue('sessionStart');
        const end = this.getDataValue('sessionEnd');
        if (start && end) {
          return Math.floor((end - start) / 1000);
        }
        return null;
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    modelName: 'PlayerSession',
    tableName: 'player_sessions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['player_name']
      },
      {
        fields: ['session_start']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  PlayerSession.associate = function(models) {
    // Define associations here if needed
  };

  return PlayerSession;
};