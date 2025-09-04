'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class medicine_masters extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.vaccine_logs, {
        foreignKey: 'medicine_id',
        as: 'vaccine_logs',
      });
      this.hasMany(models.treatment_logs, {
        foreignKey: 'medicine_id',
        as: 'treatment_logs',
      });
      this.belongsTo(models.users, {
        foreignKey: 'user_id',
        as: 'users',
      });
    }
  }
  medicine_masters.init({
    user_id: DataTypes.INTEGER,
    type: DataTypes.ENUM('medicine', 'vaccine'),
    medicine_name: DataTypes.STRING,
    method: DataTypes.STRING,
    withdrawl: DataTypes.STRING,
    withdrawl_unit: DataTypes.STRING,
    recommended_dosage: DataTypes.STRING,
    brand: DataTypes.STRING,
    notes: DataTypes.STRING,
    is_active: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',  // Set the default value to 'Active'
    }  }, {
    sequelize,
    modelName: 'medicine_masters',
  });
  return medicine_masters;
};