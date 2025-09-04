'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('camps_contests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id: {
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER
      },
      animal_id: {
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      date: {
        type: Sequelize.DATE
      },
      time: {
        type: Sequelize.STRING
      },
      city: {
        type: Sequelize.STRING
      },
      location: {
        type: Sequelize.STRING
      },
      cost: {
        type: Sequelize.STRING
      },
      parent_notes: {
        type: Sequelize.STRING
      },
      counselor_notes: {
        type: Sequelize.STRING
      },
      awards: {
        type: Sequelize.STRING
      },
      showman_notes: {
        type: Sequelize.STRING
      },
      checklist: {
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
    await queryInterface.dropTable('camps_contests');
  }
};