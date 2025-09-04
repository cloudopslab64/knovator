'use strict';
const { Model, Op, Sequelize } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class country_masters extends Model {
    static associate(models) {
      // define association here
      this.hasMany(models.users, {foreignKey: "country_calling_code_id", as: "users"});
      this.hasMany(models.admin_user_masters, {foreignKey: "country_calling_code_id", as: "admin_user_masters"});
      this.hasMany(models.temp_mobile_number_verifications, {foreignKey: "country_calling_code_id", as: "temp_mobile_number_verifications"});
      this.hasMany(models.state_masters, {foreignKey: "country_id", as: "state_masters"});
    }
  }

  country_masters.init({
    country_code: {
      type: DataTypes.STRING,
      unique: {
        msg: 'The country code must be unique.'
      },
    },
    country_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: 'The country name must be unique.'
      },
      validate: {
        notEmpty: {
          msg: 'Country name cannot be empty.'
        }
      }
    },
    country_calling_code: {
      type: DataTypes.STRING,
      // allowNull: false,
      unique: {
        msg: 'The code must be unique.'
      },
      // validate: {
      //   notEmpty: {
      //     msg: 'Code cannot be empty.'
      //   }
      // }
    },
    flag_icon: {
      type: DataTypes.STRING,
      allowNull: true, // Assuming flag_icon can be null initially, adjust as necessary
      unique: {
        msg: 'The flag icon must be unique.'
      }
    },
    timezone: {
      type: DataTypes.STRING,
    },
    is_active: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active',  // Set the default value to 'Active'
      }
  }, {
    sequelize,
    modelName: 'country_masters',
  });

    // Hook for case-insensitive uniqueness check for country_name
    country_masters.addHook('beforeSave', async (instance, options) => {
      // Check for existing country_name (case-insensitive)
      const existingCountryName = await country_masters.findOne({
        where: {
          [Sequelize.Op.and]: [
            Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('country_name')), Sequelize.fn('LOWER', instance.country_name)),
            { id: { [Sequelize.Op.ne]: instance.id } }, // Exclude the current record during update
          ],
        },
      });
  
      if (existingCountryName) {
        throw new Error(`Country name '${instance.country_name}' must be unique.`);
      }
    });

  return country_masters;
};
