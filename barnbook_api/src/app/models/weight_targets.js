'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class weight_targets extends Model {
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
    }
  }
  weight_targets.init({
    animal_id: DataTypes.INTEGER,
    target_date: DataTypes.DATE,
    target_weight: DataTypes.DOUBLE,
    weekly_target_weight: DataTypes.DOUBLE,
    target_weight_unit: DataTypes.STRING,
    weekly_target_weight_unit: DataTypes.STRING,
    is_active: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',  // Set the default value to 'Active'
    }  }, {
    sequelize,
    modelName: 'weight_targets',
  });
  return weight_targets;
};