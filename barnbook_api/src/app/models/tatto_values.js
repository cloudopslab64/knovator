'use strict';
const { Model, Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class tatto_values extends Model {
    static associate(models) {
      // Define association here
      this.belongsTo(models.animals, {
        foreignKey: 'animal_id',
        as: 'animals',
      });
    }
  }

  tatto_values.init({
    animal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Animal ID is required.',
        },
        isInt: {
          msg: 'Animal ID must be an integer.',
        },
      }
    },
    tatto_id: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Tatto ID is required.',
        },
      }
    },
    tatto_number: DataTypes.STRING,
    address: DataTypes.STRING,
    tatto_date: DataTypes.DATE,
    tatto_location: DataTypes.STRING,
    is_active: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',  // Set the default value to 'Active'
    }  }, {
    sequelize,
    modelName: 'tatto_values',
  });

  // Before save hook to check for existing animal_id
  // tatto_values.addHook('beforeSave', async (instance, options) => {
  //   const { animal_id, id } = instance;
  //   const existingRecord = await tatto_values.findOne({
  //     where: {
  //       animal_id,
  //       id: {
  //         [Op.ne]: id // Ensure the current instance's id is not included
  //       }
  //     }
  //   });

  //   if (existingRecord) {
  //     throw new Error('Animal ID already exists. Please use a different Animal ID.');
  //   }
  // });

  return tatto_values;
};