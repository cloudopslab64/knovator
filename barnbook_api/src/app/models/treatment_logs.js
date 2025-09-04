'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class treatment_logs extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.animals, {
        foreignKey: 'animal_id',
        as: 'animals',
      });

      this.belongsTo(models.medicine_masters, {
        foreignKey: 'medicine_id',
        as: 'medicine_masters',
      });
    }
  }
  treatment_logs.init({
    animal_id: DataTypes.INTEGER,
    treatment_date: DataTypes.STRING,
    injury_illness_info: DataTypes.STRING,
    temprature: DataTypes.STRING,
    temprature_unit: DataTypes.STRING,
    action: DataTypes.STRING,
    notes: DataTypes.STRING,
    medicine_id: DataTypes.INTEGER,
    dose: DataTypes.STRING,
    dose_unit: DataTypes.STRING,
    method: DataTypes.STRING,
    reason: DataTypes.STRING,
    is_active: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',  // Set the default value to 'Active'
    }  }, {
    sequelize,
    modelName: 'treatment_logs',
  });
  return treatment_logs;
};