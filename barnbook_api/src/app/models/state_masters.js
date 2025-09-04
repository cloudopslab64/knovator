'use strict';
const { Model, Op, Sequelize } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class state_masters extends Model {
    static associate(models) {
      // Define association here
      this.belongsTo(models.country_masters, {
        foreignKey: "country_id", // Foreign key in state_masters
        as: "country_masters", // Alias for the association
      });
    }
  }

  state_masters.init({
    state_code: {
      type: DataTypes.STRING,
    },
    state_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'State name cannot be empty.'
        }
      }
    },
    country_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Country ID cannot be empty.'
        }
      }
    },
    is_active: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active',  // Set the default value to 'Active'
      }
  }, {
    sequelize,
    modelName: 'state_masters',
    hooks: {
      async beforeSave(instance, options) {
        // Check if the combination of `state_name` and `country_id` already exists (case-insensitive)
        const existingState = await state_masters.findOne({
          where: {
            [Op.and]: [
              Sequelize.where(
                Sequelize.fn("LOWER", Sequelize.col("state_name")),
                Sequelize.fn("LOWER", instance.state_name)
              ),
              { country_id: instance.country_id },
              { id: { [Op.ne]: instance.id } }, // Exclude the current record during update
            ],
          },
        });
    
        if (existingState) {
          throw new Error(
            `State '${instance.state_name}' already exists for the specified country.`
          );
        }
      },
    },
  });

  return state_masters;
};
