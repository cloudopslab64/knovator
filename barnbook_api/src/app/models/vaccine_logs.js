'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class vaccine_logs extends Model {
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
  vaccine_logs.init({
    animal_id: DataTypes.INTEGER,
    vaccine_name: DataTypes.STRING,
    vaccine_date: DataTypes.STRING,
    medicine_id: DataTypes.INTEGER,
    dose: DataTypes.STRING,
    method: DataTypes.STRING,
    reason: DataTypes.STRING,
    notes: DataTypes.TEXT,
    unit: DataTypes.STRING,
    is_active: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',  // Set the default value to 'Active'
    }  }, {
    sequelize,
    modelName: 'vaccine_logs',
  });
  return vaccine_logs;
};