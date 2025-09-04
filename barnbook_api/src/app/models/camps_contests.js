'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class camps_contests extends Model {
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
      this.belongsTo(models.animals, {
        foreignKey: 'animal_id',
        as: 'animals',
      });
    }
  }
  camps_contests.init({
    user_id: DataTypes.INTEGER,
    animal_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    date: DataTypes.DATE,
    time: DataTypes.STRING,
    city: DataTypes.STRING,
    location: DataTypes.STRING,
    cost: DataTypes.STRING,
    parent_notes: DataTypes.STRING,
    counselor_notes: DataTypes.STRING,
    awards: DataTypes.STRING,
    showman_notes: DataTypes.STRING,
    checklist: DataTypes.JSONB,
    banner: DataTypes.STRING,
    is_active: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',  // Set the default value to 'Active'
    }
  }, {
    sequelize,
    modelName: 'camps_contests',
    hooks: {
      afterCreate: async (campContest, options) => {
        // Set the default banner value if it's not provided
        if (!campContest.banner) {
          campContest.banner = 'uploads/defaultImages/campsContest.jpg';
          // Save the updated record with the default banner path
          await campContest.save();
        }
      }
    }
  });
  return camps_contests;
};