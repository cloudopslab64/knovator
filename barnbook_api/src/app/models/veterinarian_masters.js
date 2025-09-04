'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class veterinarian_masters extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.vaccine_logs, {
        foreignKey: 'veterinarian_id',
        as: 'vaccine_logs',
      });
      this.belongsTo(models.country_masters, {
        foreignKey: 'country_id',
        as: 'country_masters'
      });
      this.belongsTo(models.state_masters, {
        foreignKey: 'state_id',
        as: 'state_masters'
      });
      this.belongsTo(models.animals, {
        foreignKey: 'animal_id',
        as: 'animals'
      });
      this.belongsTo(models.users, {
        foreignKey: "user_id",
        as: "users",
      });
    }
  }
  veterinarian_masters.init({
    user_id: DataTypes.INTEGER,
    animal_id: DataTypes.INTEGER,
    office_name: DataTypes.STRING,
    veterinarian_1: DataTypes.STRING,
    veterinarian_2: DataTypes.STRING,
    office_phone: DataTypes.STRING,
    address: DataTypes.STRING,
    country_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    state_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    is_active: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',  // Set the default value to 'Active'
    }}, {
    sequelize,
    modelName: 'veterinarian_masters',
    timestamps: true
  });
  return veterinarian_masters;
};