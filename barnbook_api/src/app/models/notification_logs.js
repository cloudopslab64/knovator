'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class notification_logs extends Model {
    static associate(models) {
      // Define associations here
      this.belongsTo(models.users, {
        foreignKey: 'exhibitor_id',
        as: 'exhibitor', // Alias for the relationship
      });
      this.belongsTo(models.users, {
        foreignKey: 'barn_manager_id',
        as: 'barn_manager', // Alias for the relationship
      });
    }
  }

  notification_logs.init({
    exhibitor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    barn_manager_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    notification_title: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.STRING,
    },
    is_read: {
      type: DataTypes.ENUM('Active', 'Inactive'), // or change to BOOLEAN if it suits your needs
      defaultValue: "Inactive"
    },
  }, {
    sequelize,
    modelName: 'notification_logs',
    tableName: 'notification_logs', // Specify the table name
  });

  return notification_logs;
};
