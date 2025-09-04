'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class products extends Model {
    static associate(models) {
      // Define associations here
      // this.hasMany(models.subscriptions, {
      //   foreignKey: 'product_id',
      //   as: 'subscriptions', // Alias for the relationship
      // });
    }
  }

  products.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    event_id: {
      type: DataTypes.STRING,
      unique: true
    },
    product_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    product_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    product_description: {
      type: DataTypes.TEXT,
    },
    product_type: {
      type: DataTypes.STRING,
    },
    product_category: {
      type: DataTypes.STRING,
    },
    image_url: {
      type: DataTypes.STRING,
    },
    home_url: {
      type: DataTypes.STRING,
    },
    is_active: {
      type: DataTypes.ENUM('Active', 'Inactive'),
    },
  }, {
    sequelize,
    modelName: 'products',
    tableName: 'products', // Specify the table name
  });

  return products;
};
