'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('user_subscriptions', 'payment_type', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'paypal', // Default value set to 'paypal'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('user_subscriptions', 'payment_type');
  }
};
