'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class show_events extends Model {
    static associate(models) {
      // Define association here
      // This defines that show_events belongs to a show (show_id is the foreign key)
      this.belongsTo(models.shows, {
        foreignKey: 'show_id',
        as: 'shows'
      });
      this.belongsTo(models.animals, {
        foreignKey: 'animal_id',
        as: 'animals'
      });
    }
  }

  show_events.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    show_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    animal_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    event_title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false
    },
    is_active: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active',  // Set the default value to 'Active'
      } 
  }, {
    sequelize,
    modelName: 'show_events',
    tableName: 'show_events',  // Explicitly specifying the table name if needed
    timestamps: true  // Enables createdAt and updatedAt fields
  });

  return show_events;
};
