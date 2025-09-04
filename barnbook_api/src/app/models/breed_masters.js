"use strict";
const { Model, Op, Sequelize  } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class breed_masters extends Model {
    static associate(models) {
      this.belongsTo(models.animal_categories, {foreignKey: "animal_category_id", as: "animal_categories"})
    }
  }

  breed_masters.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      breed_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Breed name cannot be empty",
          },
        },
      },
      animal_category_id: {
        type: DataTypes.INTEGER,
      },
      is_active: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active',  // Set the default value to 'Active'
      } 
    },
    {
      sequelize,
      modelName: "breed_masters",
      tableName: "breed_masters",
      hooks: {
        async beforeSave(instance, options) {
          // Check if the `breed_name` already exists within the same `animal_category_id` (case-insensitive)
          const existingBreed = await breed_masters.findOne({
            where: {
              [Op.and]: [
                Sequelize.where(
                  Sequelize.fn("LOWER", Sequelize.col("breed_name")),
                  Sequelize.fn("LOWER", instance.breed_name)
                ),
                { animal_category_id: instance.animal_category_id },
                { id: { [Op.ne]: instance.id } }, // Exclude the current record during update
              ],
            },
          });
      
          if (existingBreed) {
            throw new Error(
              `Breed name '${instance.breed_name}' already exists in the specified animal category`
            );
          }
        },
      },
    }
  );
  return breed_masters;
};
