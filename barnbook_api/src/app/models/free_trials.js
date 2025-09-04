'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class free_trials extends Model {
    static associate(models) {
      // Define association here
      this.belongsTo(models.users, {
        foreignKey: "user_id", // Foreign key in free_trials
        as: "users", // Alias for the association
      });
    }
  }

  free_trials.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW, // Default to current timestamp
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true, // Optional end date
    },
    status: {
      type: DataTypes.ENUM('active', 'expired'),
      defaultValue: 'active', // Default value 'Active'
    },
  }, {
    sequelize,
    modelName: 'free_trials'
  });

  return free_trials;
};
