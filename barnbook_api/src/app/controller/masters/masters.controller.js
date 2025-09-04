const Model = require("../../models");
var commonfunction = require("../commanfunction/commanfunction.controller");
var response = require("../../middleware/response.middleware");
const { Op, fn, col, literal } = require("sequelize");
const sequelize = require("sequelize");
const moment = require('moment');

// master create and update
exports.saveRecords = async (req, res) => {
  try {
    if (!req.body.modelName) {
      return response.fail(res, "Model Name is Required", "");
    }
    if (!req.body.inputData) {
      return response.fail(res, "Input Data is Required", "");
    }

    // replace placeholder %%...%% with values
    if (req.body.replace_status) {
      await commonfunction.replacePlaceholdersForSaveRecords(req.body)
    }

    let { id, modelName, uploadImage, uniqueNo, relation, inputData, password } = req.body;

    // Model validation
    if (!modelName || !Model[modelName]) {
      return response.fail(res, "Invalid or Missing Model Name", "");
    }
    if (!inputData) {
      return response.fail(res, "Input Data is Required", "");
    }

    if (Array.isArray(inputData) && inputData.length > 0) {
      inputData = commonfunction.processBulkUpload(req.body); // this is for the batch wise record bulk update, where animal_id is common
      await commonfunction.saveBulkData(inputData, modelName);

      if (req.body.notificationData) {
        await commonfunction.notificationLogs(req.body.notificationData, modelName, "batch created")
      }

      return response.success(res, "Bulk Records Saved!", []);
    }
    // password encrypton function
    await commonfunction.encryptedFunction(password, inputData)
    if (id) {
      const record = await Model[modelName].findByPk(id);
      if (!record) {
        return response.fail(res, "Record not found", "");
      }
      Object.assign(record, inputData);
      // upload image function
      await commonfunction.uploadMediaFile('update', record, uploadImage);

      // record.setDataValue('customOption1', 123);

      await record.save({ context: req.body });

      // insert or update sub module
      if (relation != undefined) {
        const subModuleUpdateResponse = await commonfunction.updateMultipleRecords(id, relation);
        if (subModuleUpdateResponse.code != 1) {
          return response.catchError(res, subModuleUpdateResponse.message);
        }
      }

      if (req.body.notificationData) {
        await commonfunction.notificationLogs(req.body.notificationData, modelName, "updated")
      }

      return response.success(res, "Record Updated", record);
    } else {
      // insert data
      // insert sub module
      let relationIncludes = [];
      if (relation) {
        relationIncludes = relation.map((item, i) => {
          var subRelationIncludes = [];
          if (item.subModelName != undefined && item.subModelName != "") {
            subRelationIncludes.push({ model: Model[item.subModelName], as: item.subModelName });
          }
          return { model: Model[item.modelName], as: item.modelName, include: subRelationIncludes }
        })
      }

      // unique number function 
      await commonfunction.uniqueNumberCreate(inputData, uniqueNo);
      // image upload function
      await commonfunction.uploadMediaFile('create', inputData, uploadImage);
      // insert data
      var createdRecord = await Model[modelName].create(inputData, { include: relationIncludes, context: req.body });


      if (req.body.notificationData) {
        await commonfunction.notificationLogs(req.body.notificationData, modelName, "add")
      }

      return response.success(res, "Record Created", createdRecord);
    }
  } catch (err) {
    console.log("Error:", err);
    return response.catchError(res, err.message);
  }
};

exports.getRecords = async (req, res) => {
  try {
    // replace placeholder %%...%%
    if (req.body.replace_status) {
      commonfunction.replacePlaceholders(req.body)
    }

    let { modelName, relations, whereCondition, moduleWhereCondition, subModuleWhereCondition, subSubModuleWhereCondition, search, pagination, orderBy } = req.body;

    // Model validation
    if (!modelName || !Model[modelName]) {
      return response.fail(res, "Invalid or Missing Model Name", "");
    }

    const attributes = req.body.attributes ? commonfunction.buildSequelizeAttributes(req.body.attributes) : [];

    // Build the where condition using the common function
    const sequelizeWhereCondition = commonfunction.buildWhereCondition(whereCondition);

    // Pagination
    const { limit, offset } = commonfunction.getPagination(pagination);

    // Group By
    const group = req.body.group ?? [];

    // Search functionality
    const searchCondition = commonfunction.getSearchCondition(search);

    // Relations include
    let relationIncludes = [];
    if (relations) {
      relationIncludes = await commonfunction.getRelationIncludes(relations, moduleWhereCondition, subModuleWhereCondition, subSubModuleWhereCondition);
    }

    // Order by field and order
    const orderByFieldName = orderBy?.field || 'id';  // Default to 'id'
    const orderByOrder = orderBy?.order || 'DESC';    // Default to 'DESC'

    if (req.body.orderByModel)
      orderBy = commonfunction.buildOrderBy(req.body.orderByModel);
    else
      orderBy = [[orderByFieldName, orderByOrder]]

    const queryOptions = {
      attributes: attributes && attributes.length ? attributes : {},
      where: {
        [Op.and]: [sequelizeWhereCondition, searchCondition]
      },
      order: orderBy,
      include: relationIncludes,
      offset,
      limit,
      context: req.body
    };

    // Conditionally add 'group' only if it is provided
    if (group && group.length > 0) {
      queryOptions.group = group;
    }

    // console.log(JSON.stringify(queryOptions, null, 2))

    let result;

    if (req.body.fetchCountandDateSeparately === true) {
      // Count query for pagination
      const count = await Model[modelName].count({
        where: {
          [Op.and]: [sequelizeWhereCondition, searchCondition]
        },
        include: relationIncludes, // Include relations for count
      });

      const options = {
        attributes: attributes && attributes.length ? attributes : undefined,
        where: {
          [Op.and]: [sequelizeWhereCondition, searchCondition]
        },
        order: orderBy,
        include: relationIncludes,
        limit: limit,
        offset: offset,
        subQuery: req.body.subQuery ?? false,
        group: group.length > 0 ? group : undefined, // Add group if needed
      }

      // Data query with pagination
      const rows = await Model[modelName].findAll(options);

      // assign count and rows to object to the result
      result = { count, rows };
    } else {
      // Fetching records with pagination, search, and conditions
      result = await Model[modelName].findAndCountAll(queryOptions);
    }

    // Count and Data
    let { count, rows } = result;

    if (req.body.isHomeScreenFeedSchedule) {
      rows = commonfunction.transformFeedSchduleData(rows)
    } else if (req.body.isHomeScreenExcersizeSchedule) {
      rows = commonfunction.transformExerciseScheduleData(rows)
    } else if (req.body.check_which_plan_active && req.body.check_which_plan_active.user_id) {
      rows = await commonfunction.checkActiveSubscription(rows, req.body.check_which_plan_active.user_id);
    }

    // check response has the specific value, if have then return true else false
    let isHavingValue = false;
    if (req.body.doesHaveValues) {
      isHavingValue = commonfunction.hasSpecificValues(rows, req.body.doesHaveValues);
    }

    // Respond with paginated and searched records
    return response.success(res, "Success", rows, count, limit ? Math.ceil(count / limit) : undefined, isHavingValue == true ? isHavingValue : undefined);
  } catch (err) {
    console.log("Error:", err);
    return response.fail(res, "Internal Server Error", err.message);
  }
};

exports.updaterelationaldata = async (req, res) => {
  if (!req.body.modelName) {
    return response.fail(res, "Model Name required", []);
  }
  if (!req.body.relation) {
    return response.fail(res, "Relation required", []);
  }
  if (!req.body.inputData) {
    return response.fail(res, "Input Data required", []);
  }
  if (!req.body.id) {
    return response.fail(res, "Id required", []);
  }
  const { modelName, id, relation, inputData, uploadImage } = req.body;

  if (
    !modelName ||
    !id ||
    !relation ||
    !Array.isArray(relation) ||
    relation.length === 0
  ) {
    return response.fail(res, "Provide valide modelName!");
  }

  try {
    if (id && relation.length > 0) {
      for (let i = 0; i < relation.length; i++) {
        const module = relation[i].modelName;
        const foreignKey = await getForeignKeyName(
          Model[modelName],
          Model[module]
        );
        if (module in inputData && foreignKey) {
          if (inputData[module] && inputData[module].length > 0) {
            for (let j = 0; j < inputData[module].length; j++) {
              const element = inputData[module][j];
              element[foreignKey] = id;
              if (element.id) {
                // update
                await Model[module].update(element, {
                  where: { id: element.id },
                });
              } else {
                // create
                await Model[module].create(element);
              }
            }
          }
        }
      }

      // Update the parent model
      const uploadImage = req.body.uploadImage;
      if (!Array.isArray(uploadImage)) {
        await commonfunction.uploadImageCreateOrUpdate(
          "update",
          inputData,
          uploadImage,
          modelName
        );
      }

      if (Array.isArray(uploadImage)) {
        for (let i = 0; i < uploadImage.length; i++) {
          await commonfunction.uploadImageCreateOrUpdate(
            "update",
            inputData,
            uploadImage[i],
            modelName
          );
        }
      }
      await Model[modelName].update(inputData, { where: { id: id } });
      return response.success(
        res,
        "Record Updated",
        await Model[modelName].findByPk(id)
      );
    }
    return response.fail(res, "Provide ID & Relation!");
  } catch (error) {
    console.error("Error:", error);
    // res.status(500).json({ message: "Internal server error", error: error.message });
    return response.fail(res, "Error While Updating!");
  }
};

async function getForeignKeyName(parentModel, childModel) {
  try {
    const associations = Object.values(childModel.associations);
    for (const association of associations) {
      if (association.target.name == parentModel.name) {
        return association.foreignKey;
      }
    }
  } catch (err) {
    console.log("err", err);
  }
}

// Controller to handle dynamic bulk update
exports.bulkUpdate = async (req, res) => {
  const { modelName, inputData, whereCondition } = req.body;

  // Check if the model exists
  if (!Model[modelName]) {
    return res.status(400).json({ error: 'Invalid model name provided' });
  }

  try {
    // Dynamically access the model based on the modelName
    const model = Model[modelName];

    // Update records based on the provided conditions
    const result = await model.update(inputData, {
      where: whereCondition
    });

    if (result[0] === 0) {
      return response.fail(res, "No records updated!", []);
    }

    return response.success(res, "Records updated successfully", [], result[0]);
  } catch (error) {
    console.error(error);
    return response.catchError(res, 'An error occurred during the update process', error.message);
  }
};

exports.uploadBinaryFile = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return response.fail(res, 'No files uploaded', []);
  }

  // Collect all file information
  const filesInfo = req.files.map(file => ({
    filePath: file.path,
    fileName: file.filename
  }));
  return response.success(res, 'Files uploaded successfully!', filesInfo);
};

// Soft delete controller with paranoid check
exports.softDeleteRecord = async (req, res) => {
  try {
    const { modelName, id } = req.body;

    // Check if model exists in sequelize instance
    if (!Model[modelName]) {
      return response.fail(res, `Model ${modelName} does not exist.`);
    }

    const record = Model[modelName]; // Dynamically access model

    // Check if paranoid is enabled for the model
    if (!record.options.paranoid) {
      return response.fail(res, `Soft deletion not supported for model ${modelName}.`);
    }

    // Find the record by ID
    const data = await record.findByPk(id);
    if (!data) {
      return response.fail(res, `Record with ID ${id} not found in ${modelName}.`);
    }

    // Soft delete the record using destroy (paranoid mode)
    await record.destroy({
      where: { id }
    });
    return response.success(res, `Record with ID ${id} soft deleted from ${modelName}.`, data)
  } catch (error) {
    return response.catchError(res, "Error while deleting!", error.message);
  }
};

const path = require('path'); // Import the path module
const fs = require('fs'); // Import the fs module
const { count } = require("console");



exports.modelList = async (req, res) => {
  try {
    const modelsDir = path.join(__dirname, '../../models');
    console.log("Model List");
    console.log(__dirname, '../../models')
    fs.readdir(modelsDir, (err, files) => {
      if (err) {
        console.error('Error reading models directory:', err);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
      }

      const modelNames = files.filter(file => file.endsWith('.js')).map(file => path.parse(file).name); // Get the name without the extension
      return response.success(res, "Model List", modelNames);
    });
  } catch (error) {
    console.error('Error fetching model names:', error);
    return response.catchError(res, 'Internal Server Error', []);
  }
}

exports.columnListByModel = async (req, res) => {
  const { modelName } = req.params;
  try {
    // Check if the model is defined in Sequelize
    const model = Model[modelName];
    if (!model) {
      return res.status(404).json({
        success: false,
        message: `Model "${modelName}" not found`
      });
    }

    // Describe the table to get column information
    const tableDescription = await Model.sequelize.queryInterface.describeTable(model.tableName);

    const columnNames = Object.keys(tableDescription);
    return response.success(res, `${modelName} column list`, columnNames);
  } catch (error) {
    console.error('Error fetching column names:', error);
    return response.catchError(res, 'Internal Server Error', []);
  }
}

const { water_logs } = Model;

// Function to get the average water intake per day for a specific animal

exports.getAverageWaterIntake = async (req, res) => {
  const { animal_id } = req.body; // Get animal_id from request body

  if (!animal_id) {
    return response.fail(res, "animal_id required!", {});
  }

  try {
    const averageAmount = await calculateAverageWaterIntake(animal_id);
    response.success(res, "Successfully fetched the average water intake per day!", { averageAmount });
  } catch (error) {
    console.error(error);
    response.catchError(res, "An error occurred while fetching the average water intake.", { error: error.message });
  }
};

// Separate function to calculate average water intake for the last 7 days
const calculateAverageWaterIntake = async (animal_id) => {
  // Define the date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Function to convert different units to liters
  const convertToLiters = (amount, unit) => {
    switch (unit) {
      case 'oz':
        return amount * 0.0295735; // Convert ounces to liters
      case 'gal':
        return amount * 3.78541; // Convert gallons to liters
      case 'ml':
        return amount / 1000; // Convert milliliters to liters
      default:
        return amount; // Assuming it's already in liters
    }
  };

  // Fetch the total water intake (in the specified unit) and the log_date of the last 7 days
  const logs = await water_logs.findAll({
    attributes: ['log_date', 'amount', 'unit'],
    where: {
      animal_id: animal_id, // Filter by animal_id
      log_date: {
        [sequelize.Op.gte]: sevenDaysAgo, // Only fetch logs from the last 7 days
      },
    },
    raw: true,
  });

  // Calculate total water intake in liters and count distinct log dates
  let totalAmountInLiters = 0;
  const distinctDays = new Set(); // To track distinct days

  logs.forEach(log => {
    const { amount, unit, log_date } = log;
    const amountInLiters = convertToLiters(amount, unit);
    totalAmountInLiters += amountInLiters;

    console.log(log_date);

    // Extract the date part (yyyy-mm-dd) from the log_date
    const datePart = new Date(log_date).toISOString().split('T')[0]; // Convert to ISO string and get the date part
    distinctDays.add(datePart); // Add the date to the distinct days set  });
  }
  )
  // Get the count of distinct days
  const distinctDaysCount = distinctDays.size;

  if (distinctDaysCount === 0) {
    return 0; // Return 0 if no records exist for the last 7 days
  }

  // Calculate the average water intake per distinct day
  const averageIntake = totalAmountInLiters / distinctDaysCount;

  return Math.ceil(averageIntake);
};


// water intake history duration wise
exports.getLogsHistory = async (req, res) => {
  try {
    const { modelName, animal_id, period } = req.body;
    const days = period == 'monthly' ? 30 : 30; // Default to 30 days

    // Get the date range
    const { today, startDate } = calculateDateRange(days);

    // Fetch the water logs
    let result = [];
    if (modelName == 'water_logs') {
      result = await fetchWaterLogs(startDate, today, animal_id);
    } else if (modelName == 'weight_logs') {
      result = await fetchWeightLogs(startDate, today, animal_id);
    }

    return response.success(res, "Data fetched successfully!", result)
  } catch (error) {
    console.error('Error fetching water logs:', error);
    return response.fail(res, error.message);
  }
};

function calculateDateRange(days) {
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - days); // Subtract days from today
  return { today, startDate };
}

async function fetchWaterLogs(startDate, endDate, animal_id) {
  try {
    const waterLogs = await Model['water_logs'].findAll({
      attributes: [
        [fn('DATE', col('log_date')), 'log_date'], // Extract only the date part of log_date
        [fn('SUM', col('amount')), 'total_intake'] // Sum the total amount for water logs
      ],
      where: {
        log_date: {
          [Op.between]: [startDate, endDate] // Filter logs by the specified date range
        },
        is_active: "Active", // Include only active logs
        animal_id // Add animal_id to the where condition
      },
      group: [literal("DATE(log_date)")], // Group results by the date part of log_date
      order: [['log_date', 'ASC']] // Order results by date in ascending order
    });

    console.log(waterLogs);
    return waterLogs;
  } catch (error) {
    console.error("Error fetching water logs:", error);
    throw error;
  }
}

async function fetchWeightLogs(startDate, endDate, animal_id) {
  try {
    // Fetch all logs within the specified date range and for the specified animal
    const weightLogs = await Model['weight_logs'].findAll({
      attributes: [
        [fn('DATE', col('log_date')), 'log_date'], // Extract the date part of log_date
        'weight', // Fetch the weight for each entry
        'createdAt' // We need createdAt to sort logs later
      ],
      where: {
        log_date: {
          [Op.between]: [startDate, endDate] // Filter logs by the specified date range
        },
        is_active: "Active", // Include only active logs
        animal_id // Add animal_id to the where condition
      },
      order: [['log_date', 'ASC'], ['createdAt', 'DESC']] // Order by log_date and createdAt to get the latest entry for each day
    });

    // Filter logs to keep only the most recent entry for each day
    const filteredLogs = weightLogs.reduce((acc, log) => {
      const logDate = log.get('log_date');
      if (!acc[logDate]) {
        acc[logDate] = log; // Add the first log for the date
      }
      return acc;
    }, {});

    const result = Object.values(filteredLogs); // Convert the object back to an array

    console.log(result);
    return result;
  } catch (error) {
    console.error("Error fetching weight logs:", error);
    throw error;
  }
}



// water intak history duration wise
exports.getWeightLogsHistory = async (req, res) => {
  try {
    const { period } = req.body;
    const days = period == 'monthly' ? 30 : 30; // Default to 30 days

    // Get the date range
    const { today, startDate } = calculateDateRange(days);

    // Fetch the water logs
    const weightLogs = await fetchLogs('weight_logs', startDate, today);

    return response.success(res, "Data fetched successfully!", weightLogs)
  } catch (error) {
    console.error('Error fetching water logs:', error);
    return response.fail(res, error.message);
  }
};



// Sync the database with alter option only
exports.syncDatabase = async (req, res) => {
  try {
    // Perform sync with alter option
    await Model.sequelize.sync({ alter: true });

    res.status(200).json({
      status: 'success',
      message: 'Database synced successfully with alter: true'
    });
  } catch (error) {
    console.error('Error syncing database:', error);
    res.status(500).json({
      status: 'Database sync failed',
      message: error.message,
      error: error
    });
  }
};


// Create or Update Show Controller
exports.createOrUpdateShow = async (req, res) => {
  const { modelName, id, inputData, uploadImage, relation } = req.body;

  const transaction = await Model.sequelize.transaction(); // Initialize transaction

  try {
    let banner_image = "";
    if (uploadImage && uploadImage.length > 0) {
      await commonfunction.uploadMediaFile('create', inputData, uploadImage);
    }

    // Check if the show already exists (for update)
    let showRecord = id ? await Model.shows.findOne({ where: { id }, transaction }) : null;

    if (!showRecord) {
      // Create a new show record if it doesn't exist
      showRecord = await Model.shows.create({
        user_id: inputData.user_id,
        banner_image: banner_image ? banner_image : null,
        animal_id: inputData.animal_id,
        name: inputData.name,
        date: inputData.date,
        time: inputData.time,
        city: inputData.city,
        location: inputData.location,
        judges: inputData.judges,
        fees: inputData.fees,
        type: inputData.type,
        sactioned_by: inputData.sactioned_by,
        show_notes: inputData.show_notes,
        is_active: inputData.is_active
      }, { transaction });
    } else {
      // Update the existing show record
      showRecord.user_id = inputData.user_id;
      showRecord.animal_id = inputData.animal_id;
      showRecord.banner_image = banner_image ? banner_image : inputData.banner_image;
      showRecord.name = inputData.name;
      showRecord.date = inputData.date;
      showRecord.time = inputData.time;
      showRecord.city = inputData.city;
      showRecord.location = inputData.location;
      showRecord.judges = inputData.judges;
      showRecord.fees = inputData.fees;
      showRecord.type = inputData.type;
      showRecord.sactioned_by = inputData.sactioned_by;
      showRecord.show_notes = inputData.show_notes;
      showRecord.is_active = inputData.is_active;

      // Save the updated record
      await showRecord.save({ transaction });
    }

    // Handle animal shows association
    if (relation && relation[0].modelName === 'animal_shows') {
      // First, delete all existing records for the user_id and show_id
      await Model.animal_shows.destroy({
        where: { user_id: inputData.user_id, show_id: showRecord.id },
        transaction
      });

      // Then, insert new animal show records
      await Promise.all(inputData.animal_shows.map(async (animalShowData) => {
        await Model.animal_shows.create({
          user_id: animalShowData.user_id,
          show_id: showRecord.id,
          animal_id: animalShowData.animal_id,
          show_records: animalShowData.show_records,
          is_active: animalShowData.is_active
        }, { transaction });
      }));
    }

    // Commit transaction after successful operations
    await transaction.commit();

    // Response
    return response.success(res, "Show processed successfully!", showRecord);
  } catch (error) {
    // Rollback transaction in case of any error
    await transaction.rollback();
    return response.catchError(res, "Something went wrong!", error.message);
  }
};

// Controller function to handle fetching and grouping Ration Schedules
exports.getLogs = async (req, res) => {
  const { modelName, type, animal_id } = req.body;

  try {
    // Get date range based on the type (monthly, quarterly, yearly)
    const { start, end } = commonfunction.getDateRange(type);

    // Determine the date column based on the model's structure
    let dateColumn = 'start_date'; // Default column
    const modelDateMapping = {
      'ration_schedules': {
        start: 'start_date',
        end: 'end_date',
        include: [{ model: Model.ration_masters, as: 'ration_masters' }] // Use alias here
      },
      'excersize_schedules': {
        start: 'start_date',
        end: 'end_date',
        include: [{ model: Model.excersize_masters, as: 'excersize_masters' }] // Use alias here
      },
      'weight_logs': { start: 'log_date', end: 'log_date' },
      'water_logs': { start: 'log_date', end: 'log_date' }
    };

    if (modelDateMapping[modelName]) {
      dateColumn = modelDateMapping[modelName].start; // Choose appropriate date column
    }

    // average water intake
    let averageAmount = null;
    if (modelName === 'water_logs' && animal_id) {
      averageAmount = await calculateAverageWaterIntake(animal_id);
    }

    // Fetch records based on the date range
    const records = await Model[modelName].findAll({
      where: {
        [dateColumn]: { [Op.gte]: start },
        animal_id
      },
      ...(modelDateMapping[modelName]?.end && {
        [modelDateMapping[modelName].end]: { [Op.lte]: end }
      }),
      ...(modelDateMapping[modelName]?.include && {
        include: modelDateMapping[modelName].include
      }),
      order: [
        // Order by whether the end date or log date is null first, and then by the start or log date
        [sequelize.literal(`CASE WHEN ${dateColumn} IS NULL THEN 0 ELSE 1 END`), 'DESC'],
        [dateColumn, 'DESC']
      ]
    });

    // Group the records based on the type (monthly, quarterly, yearly)
    let resp;
    switch (type) {
      case 'monthly':
        resp = commonfunction.groupByMonth(records);
        break;
      case 'quarterly':
        resp = commonfunction.groupByQuarter(records);
        break;
      case 'yearly':
        resp = commonfunction.groupByYear(records);
        break;
      default:
        return vaildationError(res, "Invalid type specified. Use monthly, quarterly, or yearly.");
    }

    // Send success response
    res.json({
      status: 201,
      code: 1,
      message: "Data fetched successfully",
      count: resp.length,
      averageWaterIntake: averageAmount,
      data: resp
    })
  } catch (error) {
    // Handle errors
    response.catchError(res, error.message, null, modelName);
  }
};

// Function to calculate average weight gain per week
exports.getWeightTarget = async (req, res) => {
  try {
    const { animal_id } = req.body; // Get animal_id from request body

    // Fetch the weight target record based on animal_id
    const weightTarget = await Model['weight_targets'].findOne({
      where: { animal_id, is_active: 'Active' },
      include: ['animals'] // Assuming you want to include associated animals
    });

    // fetch weight logs for calculating the average
    const weightLogs = await Model['weight_logs'].findAll({
      where: { animal_id },
      order: [['log_date', 'ASC']] // Orders the logs in ascending order of `log_date`
    });

    if (!weightLogs.length && weightTarget) {
      const data = {
        animal_id: weightTarget.animal_id,
        target_weight: weightTarget.target_weight,
        weekly_target_weight: weightTarget.weekly_target_weight,
        unit: weightTarget.unit,
        is_active: weightTarget.is_active,
        target_date: weightTarget.target_date,
        average_weight_last_7_days: 0
      };
      return response.success(res, "Data fetched successfully!", data)
    }

    const weeklyAverageWeight = calculateAverageWeightLast7Days(weightLogs);

    if (!weightTarget) {
      // return response.fail(res, "Weight target not found!");
      const data = {
        animal_id: "",
        target_weight: "",
        weekly_target_weight: "",
        unit: "",
        is_active: "",
        target_date: "",
        average_weight_last_7_days: weeklyAverageWeight
      };

      return response.success(res, "Data fetched successfully!", data)
    }

    // Merge the calculated weekly average into the response data
    const data = {
      animal_id: weightTarget.animal_id,
      target_weight: weightTarget.target_weight,
      weekly_target_weight: weightTarget.weekly_target_weight,
      unit: weightTarget.unit,
      is_active: weightTarget.is_active,
      target_date: weightTarget.target_date,
      average_weight_last_7_days: weeklyAverageWeight
    };

    return response.success(res, "Data fetched successfully!", data)

  } catch (error) {
    return response.catchError(res, "Someting went wrong", error.message);
  }
};

const calculateAverageWeightLast7Days = (weightLogs) => {
  if (!weightLogs.length) return 0;

  // Get the first and last weights and their dates
  const firstLog = weightLogs[0];
  const lastLog = weightLogs[weightLogs.length - 1];

  const firstWeight = firstLog.weight;
  const lastWeight = lastLog.weight;

  const firstDate = moment(firstLog.log_date);
  const lastDate = moment(lastLog.log_date);

  // Calculate the total days, including both start and end dates
  const daysBetween = lastDate.diff(firstDate, 'days') + 1; // Add 1 to include the start date

  // Calculate the total weight increase
  const totalWeightIncrease = lastWeight - firstWeight;

  // Calculate the average weight increase per day
  const averagePerDayWeightIncrease = totalWeightIncrease / daysBetween;

  // Calculate the average weight increase per week
  const averagePerWeekWeightIncrease = averagePerDayWeightIncrease * 7;

  return averagePerWeekWeightIncrease.toFixed(2); // Rounded to 2 decimal places
};


// Controller to get count of unread notifications
exports.getUnreadNotificationCount = async (req, res) => {
  try {
    // Define barn_manager_id as 92 (or can be passed dynamically through query params)
    const barnManagerId = req.body.barnManagerId;

    // Using Sequelize query syntax to fetch the count
    const count = await Model['notification_logs'].count({
      where: {
        is_read: {
          [Model.Sequelize.Op.ne]: 'Active'  // 'ne' stands for 'not equal to'
        },
        barn_manager_id: barnManagerId
      }
    });

    // Return the count in the response
    return res.json({
      status: 201,
      code: 1,
      count: count
    });
  } catch (error) {
    console.error("Error fetching unread notification count:", error.message);
    return res.json({
      status: 500,
      code: 0,
      message: 'An error occurred while fetching unread notifications count.',
      error: error.message
    });
  }
};