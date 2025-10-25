'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('player_block_stats', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      player_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      block_type: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      action_type: {
        type: Sequelize.ENUM('break', 'place'),
        allowNull: false
      },
      count: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Tambahkan index untuk pencarian cepat leaderboard
    await queryInterface.addIndex('player_block_stats', ['player_name']);
    await queryInterface.addIndex('player_block_stats', ['block_type']);
    await queryInterface.addIndex('player_block_stats', ['action_type']);
    await queryInterface.addIndex('player_block_stats', ['player_name', 'block_type', 'action_type'], {
      unique: true
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('player_block_stats');
  }
};