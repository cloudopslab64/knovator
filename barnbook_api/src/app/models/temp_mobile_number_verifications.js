'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class temp_mobile_number_verifications extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.country_masters, {
        foreignKey: "country_calling_code_id",
        as: "country_masters",
      });
    }
  }
  temp_mobile_number_verifications.init({
    mobile_number: DataTypes.STRING,
    otp: DataTypes.STRING,
    otp_expiry: DataTypes.DATE,
    country_calling_code_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'temp_mobile_number_verifications',
  });
  return temp_mobile_number_verifications;
};