'use strict';
const { Model } = require('sequelize');
const path = require('path'); // To easily extract the file extension

module.exports = (sequelize, DataTypes) => {
  class animal_documents extends Model {
    static associate(models) {
      // Define associations here, e.g., associating the document with an animal
      this.belongsTo(models.animals, { foreignKey: 'animal_id', as: 'animals' });
    }
  }

  animal_documents.init({
    document_name: {
      type: DataTypes.STRING,
      allowNull: true // Can be nullable if not always required
    },
    file_path: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'File path cannot be empty.'
        }
      }
    },
    valid_date: {
      type: DataTypes.STRING,
      allowNull: true, // Assuming valid_date might not always be required
    },
    document_type: {
      type: DataTypes.STRING,
      allowNull: true, // If document type is optional
      validate: {
        notEmpty: {
          msg: 'Document type cannot be empty.'
        }
      }
    },
    animal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Animal ID cannot be empty.'
        },
        isInt: {
          msg: 'Animal ID must be an integer.'
        }
      }
    },
    file_type: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.file_path) {
          return 'UNKNOWN'; // Return 'UNKNOWN' if file_path is null or empty
        }
        const ext = path.extname(this.file_path).toLowerCase(); // Get file extension
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
    }
  }, {
    sequelize,
    modelName: 'animal_documents',
    timestamps: true // for createdAt and updatedAt
  });

  return animal_documents;
};
