"use strict";
const { Model, Op, Sequelize } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class animal_categories extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.breed_masters, {
        foreignKey: "animal_category_id",
        as: "breed_masters",
      });
      this.hasMany(models.animals, {
        foreignKey: "animal_category_id",
        as: "animals",
      });
      this.hasMany(models.animals, {
        foreignKey: "animal_category_id",
        as: "ration_masters",
      });
    }
  }
  animal_categories.init(
    {
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: "Animal category name must be unique",
        },
        validate: {
          notEmpty: {
            msg: "Animal category name cannot be empty",
          },
          len: {
            args: [1, 255],
            msg: "Animal category name must be between 1 and 255 characters long",
          },
        },
      },
      icon: {
        type: DataTypes.STRING
      },
      is_active: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active',  // Set the default value to 'Active'
      }
    },
    {
      sequelize,
      modelName: "animal_categories",
      hooks: {
        async beforeSave(instance, options) {
          // Check if the `category` already exists for another record
          const existingCategory = await animal_categories.findOne({
            where: {
              [Op.and]: [
                Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("category")), Sequelize.fn("LOWER", instance.category)),
                { id: { [Op.ne]: instance.id } }, // Exclude the current record during update
              ],
            },
          });

          if (existingCategory) {
            throw new Error("Animal category name must be unique");
          }
        },
      },
    }
  );
  return animal_categories;
};
