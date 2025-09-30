'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('player_sessions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      player_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      session_start: {
        type: Sequelize.DATE,
        allowNull: false
      },
      session_end: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('player_sessions', ['player_name']);
    await queryInterface.addIndex('player_sessions', ['session_start']);
    await queryInterface.addIndex('player_sessions', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('player_sessions');
  }
};