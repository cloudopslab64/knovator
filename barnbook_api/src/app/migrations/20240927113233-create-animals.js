'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('animals', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      animal_type: {
        type: Sequelize.INTEGER
      },
      cattle_name: {
        type: Sequelize.STRING
      },
      tag: {
        type: Sequelize.STRING
      },
      dob: {
        type: Sequelize.DATE
      },
      age: {
        type: Sequelize.INTEGER
      },
      sex_id: {
        type: Sequelize.INTEGER
      },
      breed_id: {
        type: Sequelize.INTEGER
      },
      show_type_id: {
        type: Sequelize.INTEGER
      },
      exhibitor_id: {
        type: Sequelize.INTEGER
      },
      photo_url: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('animals');
  }
};