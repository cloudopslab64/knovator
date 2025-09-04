'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class configurations extends Model {
    static associate(models) {
      // Define associations here if needed
    }
  }

  configurations.init({
    android_current_version_number: {
      type: DataTypes.STRING,
    },
    ios_current_version_number: {
      type: DataTypes.STRING,
    },
    is_update_mandatory_for_android: {
      type: DataTypes.BOOLEAN,
    },
    is_update_mandatory_for_ios: {
      type: DataTypes.BOOLEAN,
    },
    android_store_url: {
      type: DataTypes.STRING,
    },
    ios_store_url: {
      type: DataTypes.STRING,
    },
    authentication_type: {
      type: DataTypes.ENUM('SMS', 'Email'),
    },
    free_trial_days: {
      type: DataTypes.INTEGER
    },
    free_trial_features: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    landing_screen_image: {
      type: DataTypes.STRING,
    },
    is_ios_pay_enable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,  
    },
    paypal_product_id: {
      type: DataTypes.STRING
    },
    is_active: {
      type: DataTypes.ENUM("Active", "Inactive"),
      defaultValue: "Active"
    }
  }, {
    sequelize,
    modelName: 'configurations',
    tableName: 'configurations', // Specify the table name
  });

  return configurations;
};
