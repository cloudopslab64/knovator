"use strict";
const { Model, DataTypes, Op } = require("sequelize");

module.exports = (sequelize) => {
  class users extends Model {
    static associate(models) {
      this.belongsTo(models.country_masters, {
        foreignKey: "country_calling_code_id",
        as: "country_masters",
      });

      this.belongsTo(users, {
        foreignKey: "manager_id",
        as: "manager", // A user belongs to a manager (also a user)
      });

      this.hasMany(users, {
        foreignKey: "manager_id",
        as: "subordinates", // A manager has many subordinates (users)
      });

      this.hasMany(models.animals, {
        foreignKey: "user_id",
        as: "animals",
      });

      this.hasMany(models.user_yqcas, {
        foreignKey: "user_id",
        as: "user_yqcas",
      });
      this.hasMany(models.user_associations, {
        foreignKey: "user_id",
        as: "user_associations",
      });
      this.hasMany(models.user_tax_documents, {
        foreignKey: "user_id",
        as: "user_tax_documents",
      });
      this.hasMany(models.camps_contests, {
        foreignKey: "user_id",
        as: "camps_contests",
      });
      this.hasMany(models.shows, {
        foreignKey: "user_id",
        as: "shows",
      });
      this.hasMany(models.excersize_masters, {
        foreignKey: "user_id",
        as: "excersize_masters",
      });
      this.hasMany(models.ration_masters, {
        foreignKey: "user_id",
        as: "ration_masters",
      });
      this.hasMany(models.veterinarian_masters, {
        foreignKey: "user_id",
        as: "veterinarian_masters",
      });
      this.hasMany(models.medicine_masters, {
        foreignKey: "user_id",
        as: "medicine_masters",
      });
      this.hasMany(models.free_trials, {
        foreignKey: "user_id", // Foreign key in free_trials
        as: "free_trials", // Alias for the association
      });
      this.hasMany(models.user_subscriptions, {
        foreignKey: 'user_id',
        as: 'user_subscriptions', // Alias for the relationship
      });
    }
  }

  users.init(
    {
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: {
            args: [1, 100],
            msg: "First name must be between 1 and 100 characters.",
          },
        },
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: {
            args: [1, 100],
            msg: "Last name must be between 1 and 100 characters.",
          },
        },
      },
      // Virtual field for full name
      full_name: {
        type: DataTypes.VIRTUAL,
        get() {
          return `${this.first_name} ${this.last_name}`;
        }
      },
      email: {
        type: DataTypes.STRING,
        validate: {
          isEmail: {
            msg: "Must be a valid email address.",
          },
        },
      },
      country_calling_code_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      mobile_number: {
        type: DataTypes.STRING,
      },
      otp: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      otp_expiry: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      access_level: {
        type: DataTypes.ENUM("beginner", "intermediate", "expert"),
        defaultValue: "expert",
      },
      role: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
          isIn: [[1, 2]], // Ensures role is either 1 (user) or 2 (exhibitor)
        },
        comment: "1 means user and 2 means exhibitor",
      },
      photo: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "uploads/users/profileImage/1731042483613-777.png"
      },
      manager_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      is_login_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "if true then exhibitor can login, else not able to login",
      },
      is_active: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active',  // Set the default value to 'Active'
      }
    },
    {
      sequelize,
      modelName: "users",
      tableName: "users",
      hooks: {
        beforeSave: async (user) => {
          if (!user.photo) {
            // Update the photo field in the database after creation
            user.photo = "uploads/defaultImages/defaultProfileImage.png";
          }

          if (user.manager_id) {
              const managerExists = await users.findOne({
                where: { id: user.manager_id, role: 1 },
              });
              if (!managerExists) {
                throw new Error("Manager ID does not exist.");
              }
            }

            if (user.mobile_number && user.country_calling_code_id) {
              // Check for unique mobile_number when verified
              const existingUserWithMobile = await users.findOne({
                where: {
                  country_calling_code_id: user.country_calling_code_id,
                  mobile_number: user.mobile_number,
                  is_login_required: true,
                  id: { [Op.ne]: user.id },
                },
              });
              if (existingUserWithMobile) {
                throw new Error("Mobile number already exists");
              }
            }

            if (user.email) {
              console.log(user);
              // Check for unique email when verified
              const existingUserWithEmail = await users.findOne({
                where: {
                  email: user.email,
                  id: { [Op.ne]: user.id },
                },
              });
              if (existingUserWithEmail) {
                throw new Error("Email address already exists");
              }
            }
          },
        },
      }
  );

  return users;
};



// -- CREATE OR REPLACE FUNCTION set_default_photo()
// -- RETURNS TRIGGER AS $$
// -- BEGIN
// --     -- If the new value of the 'photo' column is NULL, set it to the default path
// --     IF NEW.photo IS NULL THEN
// --         NEW.photo := 'uploads/users/profileImage/1731042483613-777.png';
// --     END IF;
// --     RETURN NEW;
// -- END;
// -- $$ LANGUAGE plpgsql;

// -- CREATE TRIGGER set_default_photo_trigger
// -- BEFORE INSERT OR UPDATE ON users
// -- FOR EACH ROW
// -- EXECUTE FUNCTION set_default_photo();