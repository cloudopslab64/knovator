'use strict';
const { Model, Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class excersize_schedules extends Model {
    static associate(models) {
      // Define associations
      this.belongsTo(models.animals, {
        foreignKey: 'animal_id',
        as: 'animals',
      });

      this.belongsTo(models.excersize_masters, {
        foreignKey: 'excersize_id',
        as: 'excersize_masters',
      });
    }
  }

  excersize_schedules.init({
    animal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: 'Animal ID is required' },
        isInt: { msg: 'Animal ID must be an integer' }
      }
    },
    excersize_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: 'Excersize ID is required' },
        isInt: { msg: 'Excersize ID must be an integer' }
      }
    },
    // JSONB field for days of the week (only Monday-Sunday allowed)
    days: {
      type: DataTypes.JSONB,
      allowNull: false,
      // validate: {
      //   notNull: { msg: 'Days are required' },
      //   isValidDays(value) {
      //     const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      //     if (!Array.isArray(value) || !value.every(day => validDays.includes(day))) {
      //       throw new Error('Days must only contain valid weekdays (Monday-Sunday)');
      //     }
      //   }
      // }
    },
    // JSONB field for timings (array of time strings)
    timings: {
      type: DataTypes.JSONB,
      allowNull: false,
      // validate: {
      //   notNull: { msg: 'Timings are required' },
      //   isValidTimings(value) {
      //     const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      //     if (!Array.isArray(value) || !value.every(time => timeRegex.test(time))) {
      //       throw new Error('Each timing must be in HH:mm format');
      //     }
      //   }
      // }
    },
    duration: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      validate: {
        notNull: { msg: 'Duration is required' },
        isFloat: { msg: 'Duration must be a number' }
      }
    },
    start_date: {
      type: DataTypes.DATE,
    },
    end_date: {
      type: DataTypes.DATE,
    },
    is_active: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',  // Set the default value to 'Active'
    }
  }, {
    sequelize,
    modelName: 'excersize_schedules',
    hooks: {
      beforeCreate: async (excersizeSchedule, options) => {
        setStartAndEndDate(excersizeSchedule);
      },
      afterCreate: async (newExcersizeSchedule, options) => {
        await updateEndDateForPreviousSchedule(newExcersizeSchedule, sequelize);
      },
    },
  });

  return excersize_schedules;
};

const updateEndDateForPreviousSchedule = async (newExcersizeSchedule, sequelize) => {
  const { animal_id, excersize_id, id } = newExcersizeSchedule; // Extract id as well

  // Find any existing record with the same animal_id and ration_id where end_date is null and id is not equal to the new id
  const existingRecord = await sequelize.models.excersize_schedules.findOne({
    where: {
      animal_id,
      excersize_id,
      end_date: null,
      id: { [Op.ne]: id } // Ensure id is not equal to the new record's id
    },
  });

  if (existingRecord) {
    // Update the end_date to the current time for the found record
    await existingRecord.update({
      end_date: new Date(),
    });
  }
};

const setStartAndEndDate = (excersizeSchedule) => {
  excersizeSchedule.start_date = new Date();  // Set current date for start_date
  excersizeSchedule.end_date = null;          // Set end_date to null
};
