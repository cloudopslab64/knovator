'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vaccine_logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id: {
        type: Sequelize.INTEGER
      },
      animal_id: {
        type: Sequelize.INTEGER
      },
      veterinarian_id: {
        type: Sequelize.INTEGER
      },
      veterinarian_name: {
        type: Sequelize.STRING
      },
      vaccine_date: {
        type: Sequelize.DATE
      },
      medicine_id: {
        type: Sequelize.INTEGER
      },
      dose: {
        type: Sequelize.STRING
      },
      method: {
        type: Sequelize.STRING
      },
      reason: {
        type: Sequelize.STRING
      },
      notes: {
        type: Sequelize.STRING
      },
      is_active: {
        type: Sequelize.BOOLEAN
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('vaccine_logs');
  }
};