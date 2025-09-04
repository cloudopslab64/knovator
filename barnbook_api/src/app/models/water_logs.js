'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class water_logs extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.animals, {
        foreignKey: 'animal_id',
        as: 'animals'
      });
    }
  }
  water_logs.init({
    animal_id: DataTypes.INTEGER,
    log_date: {type: DataTypes.DATE, allowNull: false},
    amount: {type: DataTypes.DOUBLE, allowNull: false},
    unit: {type: DataTypes.STRING, allowNull: false},
    is_active: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',  // Set the default value to 'Active'
    }  }, {
    sequelize,
    modelName: 'water_logs',
    hooks: {
      // beforeCreate: async (water_logs, options) => {
      //   setLogDate(water_logs);
      // }
    }
  });
  return water_logs;
};

const setLogDate = (water_logs) => {
  water_logs.log_date = new Date();  // Set current date for start_date
};