'use strict';
const { Model, Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class premise_values extends Model {
    static associate(models) {
      // Define association here
      this.belongsTo(models.animals, {
        foreignKey: 'animal_id',
        as: 'animals',
      });
    }
  }

  premise_values.init({
    animal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: {
        msg: 'Animal ID must be unique.',
      },
      validate: {
        notNull: {
          msg: 'Animal ID is required.',
        },
        isInt: {
          msg: 'Animal ID must be an integer.',
        },
      }
    },
    premise_id: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Premise ID is required.',
        },
      }
    },
    premise_number: DataTypes.STRING,
    breeder: DataTypes.STRING,
    premise_date: DataTypes.DATE,
    tag_location: DataTypes.STRING,
    is_active: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',  // Set the default value to 'Active'
    }  }, {
    sequelize,
    modelName: 'premise_values',
  });

  // Before save hook to check for existing animal_id
  premise_values.addHook('beforeSave', async (instance, options) => {
    const { animal_id, id } = instance;
    const existingRecord = await premise_values.findOne({
      where: {
        animal_id,
        id: {
          [Op.ne]: id // Ensure the current instance's id is not included
        }
      }
    });

    if (existingRecord) {
      throw new Error('Animal ID already exists. Please use a different Animal ID.');
    }
  });

  return premise_values;
};