'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user_masters extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  user_masters.init({
    full_name: DataTypes.STRING,
    mobile_number: DataTypes.STRING,
    email_id: DataTypes.STRING,
    otp: DataTypes.STRING,
    access_level: DataTypes.STRING,
    photo: DataTypes.STRING,
    manager_id: DataTypes.INTEGER,
    is_active: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',  // Set the default value to 'Active'
    }  }, {
    sequelize,
    modelName: 'user_masters',
  });
  return user_masters;
};