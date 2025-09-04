'use strict';
const {
  Model,
  DataTypes,
  ValidationError,
} = require('sequelize');

module.exports = (sequelize) => {
  class weight_logs extends Model {
    static associate(models) {
      // Define association here
      this.belongsTo(models.animals, {
        foreignKey: 'animal_id',
        as: 'animals',
      });
    }
  }

  weight_logs.init({
    animal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,  // animal_id must be provided
      validate: {
        isInt: {
          msg: "animal_id must be an integer"  // Validation message for integer
        },
        notNull: {
          msg: "animal_id cannot be null"  // Validation message for null
        },
      }
    },
    log_date: {
      type: DataTypes.DATE,
      validate: {
        isDate: {
          msg: "log_date must be a valid date"  // Validation message for date
        },
      }
    },
    weight: {
      type: DataTypes.DOUBLE,
      allowNull: false,  // weight must be provided
      validate: {
        notEmpty: {
          msg: "weight cannot be empty"  // Validation message for empty string
        },
        len: {
          args: [1, 10],  // Allow weight string length between 1 and 10
          msg: "weight length must be between 1 and 10 characters"
        }
      }
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,  // unit must be provided
      validate: {
        notEmpty: {
          msg: "unit cannot be empty"  // Validation message for empty string
        },
      }
    },
    is_active: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',  // Set the default value to 'Active'
    }
  }, {
    sequelize,
    modelName: 'weight_logs',
    hooks: {
      // beforeCreate: (weightLog, options) => {
      //   weightLog.log_date = new Date();  // Set log_date to today's date
      // }
    }
  });

  return weight_logs;
};