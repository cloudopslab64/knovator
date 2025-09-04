'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class animal_shows extends Model {
    static associate(models) {
      // Define associations here if needed
      animal_shows.belongsTo(models.shows, {
        foreignKey: 'show_id',
        as: 'shows',
      });
      animal_shows.belongsTo(models.animals, {
        foreignKey: 'animal_id',
        as: 'animals',
      });
      animal_shows.belongsTo(models.users, {
        foreignKey: 'user_id',
        as: 'users',
      });
    }
  }

  animal_shows.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    show_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    animal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    show_records: { type: DataTypes.JSONB, defaultValue: {} },
    is_active: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active', // Set the default value to 'Active'
    },
  }, {
    sequelize,
    modelName: 'animal_shows',
    tableName: 'animal_shows', // Specify the table name
    hooks: {
      beforeBulkCreate: async (animal_show, options) => {
        // Custom logic to be executed before saving the record
        console.log('Before saving animal_show record:', animal_show);

        // You can also perform other operations like logging or modifying fields
      }
    }
  });

  return animal_shows;
};
