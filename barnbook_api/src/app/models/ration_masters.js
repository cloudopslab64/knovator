'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ration_masters extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.ration_schedules, {
        foreignKey: 'ration_id',
        as: 'ration_schedules',
      });

      this.belongsTo(models.animal_categories, {
        foreignKey: "animal_category_id",
        as: "animal_categories",
      });

      this.belongsTo(models.users, {
        foreignKey: "user_id",
        as: "users",
      });
    }
  }
  ration_masters.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    animal_category_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ration_name: DataTypes.STRING,
    ration_details: DataTypes.JSONB,
    is_active: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',  // Set the default value to 'Active'
    }  }, {
    sequelize,
    modelName: 'ration_masters',
  });
  return ration_masters;
};