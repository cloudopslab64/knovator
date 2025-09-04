"use strict";
const { Model, ValidationError, Op  } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ration_schedules extends Model {
    static associate(models) {
      // define association here
      this.belongsTo(models.animals, {
        foreignKey: "animal_id",
        as: "animals",
      });

      this.belongsTo(models.ration_masters, {
        foreignKey: "ration_id",
        as: "ration_masters",
      });
    }
  }
  ration_schedules.init(
      {
        animal_id: {
            type: DataTypes.INTEGER,
            allowNull: false,  // Ensure animal_id is not null
        },
        ration_id: {
            type: DataTypes.INTEGER,
            allowNull: false,  // Ensure ration_id is not null
        },
        days: {
            type: DataTypes.JSONB,
            allowNull: false,  // Ensure days is not null
        },
        timings: {
            type: DataTypes.JSONB,
            allowNull: false,  // Ensure timings is not null
        },
        start_date: {
            type: DataTypes.DATE, // Consider using DataTypes.DATE for date values
            allowNull: true,  // Optional field
        },
        end_date: {
            type: DataTypes.DATE, // Consider using DataTypes.DATE for date values
            allowNull: true,  // Optional field
        },
        is_active: {
          type: DataTypes.ENUM('Active', 'Inactive'),
          defaultValue: 'Active',  // Set the default value to 'Active'
        }
    },
    {
      sequelize,
      modelName: "ration_schedules",
      hooks: {
        beforeCreate: async (rationSchedule, options) => {
          setStartAndEndDate(rationSchedule);
        },
        afterCreate: async (newRationSchedule, options) => {
          await updateEndDateForPreviousSchedule(newRationSchedule, sequelize);
        },
      //   afterFind: async (result, options) => {
      //     if (options.context.isHomeScreenFeedSchedule) {
      //         var groupedData = await transformData(result);
      //         return groupedData;
      //     }
      //     return result;
      // }
      },
    }
  );
  return ration_schedules;
};

const updateEndDateForPreviousSchedule = async (newRationSchedule, sequelize) => {
  const { animal_id, ration_id, id } = newRationSchedule; // Extract id as well

  // Find any existing record with the same animal_id and ration_id where end_date is null and id is not equal to the new id
  const existingRecord = await sequelize.models.ration_schedules.findOne({
    where: {
      animal_id,
      ration_id,
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

const setStartAndEndDate = (rationSchedule) => {
  rationSchedule.start_date = new Date();  // Set current date for start_date
  rationSchedule.end_date = null;          // Set end_date to null
};

// function transformData(data) {
//   // Step 1: Group all records by animal_id
//   const groupedByAnimal = data.reduce((acc, record) => {
//       if (!acc[record.animal_id]) {
//           // Initialize the group with animals and an empty feed array
//           acc[record.animal_id] = {
//               animals: record.animals, // Assign the animals object
//               feed_array: []           // Empty array for feeding records
//           };
//       }
//       // Add the current feed record to the feed array
//       acc[record.animal_id].feed_array.push({
//           id: record.id,
//           animal_id: record.animal_id,
//           ration_id: record.ration_id,
//           days: record.days,
//           timings: record.timings,
//           start_date: record.start_date,
//           end_date: record.end_date,
//           is_active: record.is_active,
//           createdAt: record.createdAt,
//           updatedAt: record.updatedAt,
//           ration_masters: record.ration_masters
//       });
//       return acc;
//   }, {});

//   // Step 2: Return the transformed data as an array
//   return Object.values(groupedByAnimal);
// }

async function transformData(data) {
  // Step 1: Group all records by animal_id
  const groupedByAnimal = data.reduce((acc, record) => {
      if (!acc[record.animal_id]) {
          // Initialize the group with animals and an empty feed array
          acc[record.animal_id] = {
              animals: record.animals, // Assign the animals object
              feed_array: []           // Empty array for feeding records
          };
      }
      // Add the current feed record to the feed array
      acc[record.animal_id].feed_array.push({
          id: record.id,
          animal_id: record.animal_id,
          ration_id: record.ration_id,
          days: record.days,
          timings: record.timings,
          start_date: record.start_date,
          end_date: record.end_date,
          is_active: record.is_active,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          ration_masters: record.ration_masters
      });
      return acc;
  }, {});

  // If you have any asynchronous operations, you can await them here
  // For example:
  // const additionalData = await fetchAdditionalData();

  // Step 2: Return the transformed data as an array
  return Object.values(groupedByAnimal);
}
