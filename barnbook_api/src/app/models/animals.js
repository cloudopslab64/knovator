"use strict";
const { Model } = require("sequelize");
const { differenceInYears } = require("date-fns");
const { Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class animals extends Model {
    static associate(models) {
      // Associations
      this.belongsTo(models.animal_categories, {
        foreignKey: "animal_category_id",
        as: "animal_categories",
      });
      this.belongsTo(models.breed_masters, {
        foreignKey: "breed_id",
        as: "breed_masters",
      });
      this.belongsTo(models.show_type_masters, {
        foreignKey: "show_type_id",
        as: "show_type_masters",
      });
      this.belongsTo(models.users, {
        foreignKey: "exhibitor_id",
        as: "user_exhibitor",
      });
      this.belongsTo(models.users, {
        foreignKey: "user_id",
        as: "user_owner",
      });
      this.hasMany(models.validation_values, {
        foreignKey: "animal_id",
        as: "validation_values",
      });
      this.hasMany(models.premise_values, {
        foreignKey: "animal_id",
        as: "premise_values",
      });
      this.hasMany(models.tatto_values, {
        foreignKey: "animal_id",
        as: "tatto_values",
      });
      this.hasMany(models.brand_values, {
        foreignKey: "animal_id",
        as: "brand_values",
      });
      this.hasMany(models.eid_values, {
        foreignKey: "animal_id",
        as: "eid_values",
      });
      this.hasMany(models.camps_contests, {
        foreignKey: "animal_id",
        as: "camps_contests",
      });
      this.hasMany(models.shows, {
        foreignKey: "animal_id",
        as: "shows",
      });
      this.hasMany(models.show_events, {
        foreignKey: "animal_id",
        as: "show_events",
      });
      this.hasMany(models.water_logs, {
        foreignKey: "animal_id",
        as: "water_logs",
      });
      this.hasMany(models.ration_schedules, {
        foreignKey: "animal_id",
        as: "ration_schedules",
      });
      this.hasMany(models.excersize_schedules, {
        foreignKey: "animal_id",
        as: "excersize_schedules",
      });
      this.hasMany(models.weight_logs, {
        foreignKey: "animal_id",
        as: "weight_logs",
      });
      this.hasMany(models.weight_targets, {
        foreignKey: "animal_id",
        as: "weight_targets",
      });
      this.hasMany(models.vaccine_logs, {
        foreignKey: "animal_id",
        as: "vaccine_logs",
      });
      this.hasMany(models.treatment_logs, {
        foreignKey: "animal_id",
        as: "treatment_logs",
      });
      this.hasMany(models.animal_documents, {
        foreignKey: "animal_id",
        as: "animal_documents",
      });
      this.hasMany(models.animal_shows, {
        foreignKey: "animal_id",
        as: "animal_shows",
      });
    }
  }

  animals.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
      },
      animal_category_id: {
        type: DataTypes.INTEGER,
      },
      cattle_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Cattle name cannot be empty",
          },
        },
      },
      tag: {
        type: DataTypes.STRING,
        allowNull: false
      },
      dob: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Date of birth cannot be empty",
          },
          isDate: {
            msg: "Date of birth must be a valid date",
          },
        },
      },
      age: {
        type: DataTypes.STRING,
        // get() {
        //   const dob = this.getDataValue("dob");
        //   if (dob) {
        //     return differenceInYears(new Date(), new Date(dob)); // Calculate age based on DOB
        //   }
        //   return null; // Return null if DOB is not available
        // },
        // set(value) {
        //   // This setter does nothing since age is derived from dob
        //   throw new Error(
        //     "Age is automatically calculated from the date of birth."
        //   );
        // },
      },
      sex: {
        type: DataTypes.ENUM('Male', 'Female', 'Other'),
        allowNull: false, // Adjust based on your requirements
      },
      breed_id: {
        type: DataTypes.INTEGER,
      },
      show_type_id: {
        type: DataTypes.INTEGER,
      },
      exhibitor_id: {
        type: DataTypes.INTEGER,
      },
      photo: {
        type: DataTypes.STRING,
      },
      // New fields added below
      purchase_date: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
          isDate: {
            msg: "Purchase date must be a valid date",
          },
        },
      },
      breeder: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      genetics: {
        type: DataTypes.STRING,
        allowNull: true, // You can make it nullable if it's not always required
      },
      breeding_method: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      price: {
        type: DataTypes.STRING, // Alternatively, if price should be numeric, use DECIMAL
        allowNull: true,
      },
      note: {
        type: DataTypes.TEXT
      },
      is_archived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      trial_allowed_animals: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_active: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active',  // Set the default value to 'Active'
      }
    },
    {
      sequelize,
      modelName: "animals",
      tableName: "animals",
      paranoid: true,  // Enable soft deletion
      hooks: {
        beforeSave: async (animal, options) => {
          // Check if the tag is unique for the given user_id
          if (animal.tag && animal.user_id) {
            const existingAnimal = await animals.findOne({
              where: {
                tag: animal.tag,
                user_id: animal.user_id,
                animal_category_id: animal.animal_category_id,
                id: {
                  [Op.ne]: animal.id, // Exclude current animal's ID during update
                },
              },
            });

            if (existingAnimal) {
              throw new Error("Tag is already taken for this animal category!");
            }
          }   
        },
      },
    }
  );
  return animals;
};
