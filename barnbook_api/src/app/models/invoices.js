'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class invoices extends Model {
    static associate(models) {
      // Define associations here
      this.belongsTo(models.users, {
        foreignKey: 'user_id',
        as: 'users', // Alias for the relationship
      });
      this.belongsTo(models.subscriptions, {
        foreignKey: 'subscription_id',
        as: 'subscriptions', // Alias for the relationship
      });
    }
  }

  invoices.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stripe_transaction_id: {
      type: DataTypes.STRING,
    },
    subscription_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.STRING,
    },
    stripe_data_json: {
      type: DataTypes.JSON, // Use JSON data type to store additional transaction data
    },
    transaction_date_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    payment_method: {
      type: DataTypes.STRING,
    },
  }, {
    sequelize,
    modelName: 'invoices',
    tableName: 'invoices', // Specify the table name
  });

  return invoices;
};
