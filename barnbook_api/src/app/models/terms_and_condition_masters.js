'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class terms_and_condition_masters extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  terms_and_condition_masters.init({
    terms_and_condition: DataTypes.TEXT,
    privacy_policy: DataTypes.TEXT,
    subscription_term_and_condition: DataTypes.TEXT,
    is_active: {type : DataTypes.ENUM("Active", "Inactive"), defaultValue: "Active"},
  }, {
    sequelize,
    modelName: 'terms_and_condition_masters',
  });
  return terms_and_condition_masters;
};