'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user_associations extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.users, {
        foreignKey: 'user_id',
        as: 'users',
      });
    }
  }
  user_associations.init({
    user_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    photo: DataTypes.STRING,
    is_active: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',  // Set the default value to 'Active'
    }  }, {
    sequelize,
    modelName: 'user_associations',
  });
  return user_associations;
};