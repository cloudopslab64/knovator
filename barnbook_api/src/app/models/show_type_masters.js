"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class show_type_masters extends Model {
    static associate(models) {
      this.hasMany(models.animals, { foreignKey: "show_type_id", as: "animals" });
    }
  }

  show_type_masters.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      show_type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Show type cannot be empty",
          },
        },
      },
      is_active: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active',  // Set the default value to 'Active'
      }
    },
    {
      sequelize,
      modelName: "show_type_masters",
      tableName: "show_type_masters",
    }
  );
  return show_type_masters;
};
