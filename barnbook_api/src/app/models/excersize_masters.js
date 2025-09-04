'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class excersize_masters extends Model {
    static associate(models) {
      this.hasMany(models.excersize_schedules, {
        foreignKey: 'excersize_id',
        as: 'excersize_schedules',
      });

      this.belongsTo(models.animal_categories, {
        foreignKey: 'animal_category_id',
        as: 'animal_categories',
      });

      this.belongsTo(models.breed_masters, {
        foreignKey: 'animal_breed_id',
        as: 'breed_masters',
      });

      this.belongsTo(models.users, {
        foreignKey: "user_id",
        as: "users",
      });
    }
  }

  excersize_masters.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    animal_category_id: {
      type: DataTypes.INTEGER,
      allowNull: false, // Required field
      validate: {
        isInt: true,     // Must be an integer
        notNull: {
          msg: 'Animal category ID is required'
        },
      },
    },
    animal_breed_id: {
      type: DataTypes.INTEGER,
      allowNull: false, // Required field
      validate: {
        isInt: true,     // Must be an integer
        notNull: {
          msg: 'Animal breed ID is required'
        },
      },
    },
    excersize_name: {
      type: DataTypes.STRING,
      allowNull: false, // Required field
      validate: {
        notEmpty: {
          msg: 'Excersize name cannot be empty'
        },
        len: {
          args: [3, 255],  // Must be between 3 and 255 characters
          msg: 'Excersize name must be between 3 and 255 characters long',
        },
      },
    },
    is_active: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',  // Set the default value to 'Active'
    }
  }, {
    sequelize,
    modelName: 'excersize_masters',
  });

  return excersize_masters;
};
