'use strict';
const { Model, DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  class admin_user_masters extends Model {
    static associate(models) {
      // Define any associations here if needed
      this.belongsTo(models.country_masters, {
        foreignKey: "country_calling_code_id",
        as: "country_masters",
      });
    }

    // Instance method to validate the password
    validatePassword(password) {
      const hash = crypto.createHash('md5').update(password).digest('hex');
      return this.password === hash;
    }
  }

  admin_user_masters.init({
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
    },
    country_calling_code_id: {
        type: DataTypes.INTEGER,
    },
    mobile_number: {
      type: DataTypes.STRING,
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: true,  // It can be null initially
    },
    otp_expiry: {
      type: DataTypes.DATE,
      allowNull: true,  // It can be null initially
    },
    is_active: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active', 
      }
  }, {
    sequelize,
    modelName: 'admin_user_masters',
    tableName: 'admin_user_masters',
  });

  return admin_user_masters;
};
