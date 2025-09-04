'use strict';
const { Model, Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class brand_values extends Model {
    static associate(models) {
      // Define association here
      this.belongsTo(models.animals, {
        foreignKey: 'animal_id',
        as: 'animals',
      });
    }
  }

  brand_values.init({
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
    brand_photo: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Brand photo is required.',
        },
      }
    },
    state_country: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'State/Country is required.',
        },
      }
    },
    brand_date: {
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
    brand_location: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Brand location is required.',
        },
      }
    },
    is_active: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',  // Set the default value to 'Active'
    }
  }, {
    sequelize,
    modelName: 'brand_values',
  });

  // Before save hook to check for existing animal_id
  brand_values.addHook('beforeSave', async (instance, options) => {
    const { animal_id, id } = instance;
    const existingRecord = await brand_values.findOne({
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

  return brand_values;
};
