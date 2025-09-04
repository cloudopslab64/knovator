'use strict';
const {
  Model
} = require('sequelize');
const path = require('path'); // To easily extract the file extension

module.exports = (sequelize, DataTypes) => {
  class user_yqcas extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.users, {
        foreignKey: 'user_id',
        as: 'users',
      });
    }
  }
  user_yqcas.init({
    user_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    yqca_date: DataTypes.DATE,
    certificate: DataTypes.STRING,
    file_type: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.certificate) {
          return 'UNKNOWN'; // Return 'UNKNOWN' if file_path is null or empty
        }
        const ext = path.extname(this.certificate).toLowerCase(); // Get file extension
        switch (ext) {
          case '.pdf':
            return 'PDF';
          case '.jpg':
          case '.jpeg':
          case '.png':
          case '.gif':
          case '.svg':
            return 'IMAGE';
          case '.xls':
          case '.xlsx':
            return 'Excel';
          default:
            return 'UNKNOWN';
        }
      }
    },  
    is_active: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',  // Set the default value to 'Active'
    }  }, {
    sequelize,
    modelName: 'user_yqcas',
  });
  return user_yqcas;
};