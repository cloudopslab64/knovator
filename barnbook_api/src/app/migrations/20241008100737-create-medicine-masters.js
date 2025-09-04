'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('medicine_masters', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id: {
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.STRING
      },
      medicine_name: {
        type: Sequelize.STRING
      },
      method: {
        type: Sequelize.STRING
      },
      withdrawl: {
        type: Sequelize.STRING
      },
      withdrawl_unit: {
        type: Sequelize.STRING
      },
      recommended_disage: {
        type: Sequelize.STRING
      },
      brand: {
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
    await queryInterface.dropTable('medicine_masters');
  }
};