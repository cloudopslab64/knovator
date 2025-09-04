'use strict';
const { Model, Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class eid_values extends Model {
    static associate(models) {
      // Define association here
      this.belongsTo(models.animals, {
        foreignKey: 'animal_id',
        as: 'animals',
      });
    }
  }

  eid_values.init({
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
    number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Number is required.',
        },
        isInt: {
          msg: 'Number must be an integer.',
        },
      }
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Type is required.',
        },
      }
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true, // Optional field
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Date is required.',
        },
        isDate: {
          msg: 'Must be a valid date.',
        }
      }
    },
    tag_location: {
      type: DataTypes.STRING,
      allowNull: true, // Optional field
    },
    is_active: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active',  // Set the default value to 'Active'
      }
  }, {
    sequelize,
    modelName: 'eid_values',
  });

  // Before save hook to check for existing animal_id
  eid_values.addHook('beforeSave', async (instance, options) => {
    const { animal_id, id } = instance;
    const existingRecord = await eid_values.findOne({
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

  return eid_values;
};
