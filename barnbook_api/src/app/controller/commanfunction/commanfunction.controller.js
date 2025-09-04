const Model = require("../../models");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
var http = require("http");
const axios = require('axios');
var momentfunction = require("./moment.controller");
var bcrypt = require("bcryptjs");
const { Sequelize, Op, fn, cast } = require('sequelize');

// unique number function
async function uniqueNumberFunction(transactionId) {
    var financialYearMasterId = 1;
    var today = new Date();
    var currentDate = moment(today).format("YYYY-MM-DD");
    // check current financial entry is in financial_year_masters or not
    var sql = `SELECT * FROM financial_year_masters WHERE ('${currentDate}' >= start_date AND '${currentDate}' <= end_date) AND is_active = 1`;
    var financialYearMasterData = await Model.sequelize.query(sql, { type: Model.sequelize.QueryTypes.SELECT, })
    var fyCode = '';
    if (financialYearMasterData.length === 0) {
        const financialYearOutput = momentfunction.calculateFinancialYear(new Date())
        fyCode = "20" + financialYearOutput;
        var startDate = moment(currentDate).format("YYYY") + '-04-01'
        var endDate = moment(currentDate).add(1, 'year').format("YYYY") + '-03-31';

        // insert into financial year master
        const financialYearMasterCreate = {
            fy_code: fyCode,
            start_date: startDate,
            end_date: endDate,
            is_active: 1
        }
        var financialYeardInsert = await Model.financial_year_masters.create(financialYearMasterCreate);
        financialYearMasterId = financialYeardInsert.dataValues.id
    } else {
        financialYearMasterId = financialYearMasterData[0].id;
        fyCode = financialYearMasterData[0].fy_code;
    }
    // check financial master entry in year master or not
    var yearTransactionMasterData = await Model.year_transaction_masters.findAll({ where: { fy_master_id: financialYearMasterId } });
    if (yearTransactionMasterData.length == 0) {
        // if not then create entry of this year transaction master
        var transactionmasterResponse = await Model.transaction_masters.findAll({ where: { is_active: 1 } });
        if (transactionmasterResponse.length > 0) {
            const yearTransactionMasterCreate = transactionmasterResponse.map((item) => ({
                fy_master_id: financialYearMasterId,
                transaction_master_id: item.transaction_id,
                transaction_series: item.transaction_name + "_" + fyCode.replace('-', ''),
                is_active: 1,
                series_start_no: 1,
            }));
            await Model.year_transaction_masters.bulkCreate(yearTransactionMasterCreate);
        }
    }

    // then again check in year transaction master
    var yearTransactionMasterResponse = await Model.year_transaction_masters.findAll({ where: { transaction_master_id: transactionId, fy_master_id: financialYearMasterId } });
    if (yearTransactionMasterResponse.length > 0) {
        const id = yearTransactionMasterResponse[0].id;
        const seriesStartNo = Number(yearTransactionMasterResponse[0].series_start_no) + 1;
        const fyMasterId = yearTransactionMasterResponse[0].fy_master_id;
        const transactionId = yearTransactionMasterResponse[0].transaction_master_id;
        const transactionSeries = yearTransactionMasterResponse[0].transaction_series;
        const uniqueId = transactionSeries + "_0" + seriesStartNo;
        const updateData = {
            fy_master_id: fyMasterId,
            transaction_master_id: transactionId,
            transaction_series: transactionSeries,
            series_start_no: seriesStartNo,
            is_active: 1,
        };
        await Model.year_transaction_masters.update(updateData, { where: { id: id }, })
        return { code: 1, data: uniqueId };
    } else {
        var transactionmasterResponse2 = await Model.transaction_masters.findAll({ where: { transaction_id: transactionId } });
        if (transactionmasterResponse2.length > 0) {
            // if transaction master having entry then create entry in year transaction masters
            const transactionMasterId = transactionmasterResponse2[0].transaction_id;
            const transactionSeries = transactionmasterResponse2[0].transaction_name + "_" + fyCode.replace('-', '');
            const uniqueId = transactionSeries + "_01";

            const yearTransactionMasterCreate = {
                fy_master_id: financialYearMasterId,
                transaction_master_id: transactionMasterId,
                transaction_series: transactionSeries,
                series_start_no: 1,
                is_active: 1,
            }
            await Model.year_transaction_masters.create(yearTransactionMasterCreate);
            return { code: 1, data: uniqueId };
        } else {
            // if no entry in transaction master then send error message
            return { code: 0, data: `Transaction Id : ${transactionId} Having No Records in transaction masters` };
        }
    }
};

// image upload function
function uploadFileFunction(base64Data, folderPath, fileName) {
    // Extract the MIME type from base64 data
    const mimeType = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,/);
    const fileExtension = (mimeType && mimeType[1]) ? mimeType[1].split('/')[1].split('+')[0] : null;

    if (!fileExtension) {
        console.error('Unable to determine file extension.');
        return { code: 0, status: 'Error determining file extension.' };
    }

    // Remove data URL prefix (e.g., "data:image/png;base64,")
    const base64File = base64Data.replace(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,/, '');

    // Create a buffer from the base64 string
    const fileBuffer = Buffer.from(base64File, 'base64');

    // Create the destination folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
    // Write the buffer to a file
    fs.writeFileSync(`${folderPath}/${fileName}.${fileExtension}`, fileBuffer);

    console.log('File uploaded successfully.');
    return { code: 1, status: 'File Uploaded', data: `${folderPath}/${fileName}.${fileExtension}` };
}


// send mail function
const nodemailer = require("nodemailer");

/**
 * Function to send an email with required fields (To, Subject, Body).
 * @param {string} emailTo - Recipient email address.
 * @param {string} emailCC - CC recipient email address (optional).
 * @param {string} emailBCC - BCC recipient email address (optional).
 * @param {string} subject - Subject of the email.
 * @param {string} body - HTML body of the email.
 * @returns {Promise} - Promise with the result of the email sending operation.
 */
async function sendMailFunction(emailTo, subject, body, emailCC, emailBCC,) {
    // Validate inputs
    if (!emailTo) {
        return { code: 0, status: "Email To is Required", data: "" };
    }
    if (!subject) {
        return { code: 0, status: "Subject is Required", data: "" };
    }
    if (!body) {
        return { code: 0, status: "Mail body is Required", data: "" };
    }
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
        // throw new Error("Gmail credentials are not set in environment variables");
        return { code: 0, status: "Gmail credentials are not set in environment variables", data: "" };
    }

    // Configure the SMTP transport
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com", // Example for Gmail SMTP
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.GMAIL_USER, // Gmail username (use environment variables)
            pass: process.env.GMAIL_PASS, // Gmail app password (use environment variables)
        },
    });

    // Set up the email data
    const mailOptions = {
        from: process.env.GMAIL_USER, // Sender's email address
        to: emailTo,                  // Recipients (To)
        cc: emailCC,                  // CC recipients (optional)
        bcc: emailBCC,                // BCC recipients (optional)
        subject: subject,             // Subject
        html: body,                   // HTML body content
    };

    // Send the email
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);

        // Return success result
        return { code: 1, status: "Email Sent", data: info.response };
    } catch (error) {
        console.log("Error: " + error);

        // Return error result
        return { code: 0, status: error.message, data: "" };
    }
}

// function smsGateWayFunction(mobile) {
//     if (!mobile) {
//         return { code: 0, status: "Mobile Number is Required", data: "" };
//     }
//     var otp = generateOTP()
//     var options = {
//         host: config.smsHost,
//         path: config.path + mobile + "/" + otp,
//     };
//     const callback1 = function (response) {
//         var str = "";
//         response.on("data", function (chunk) {
//             str += chunk;
//         });
//         response.on("end", function () {
//             const objdata = JSON.parse(str);
//             if (objdata.Status == "Success") {
//                 return { code: 1, status: "OTP Sent", data: "" };
//             } else {
//                 return { code: 0, status: error, data: "" };
//             }
//         });
//     };
//     http.request(options, callback1).end();
// };

// one signale push notification
// function sendPushNotification(playerIds, title, message) {
//     const notificationData = {
//         app_id: config.app_id,
//         contents: { en: message },
//         headings: { en: title },
//         included_segments: ['Subscribed Users'],
//         included_player_ids: playerIds,
//         content_available: true,
//         small_icon: 'ic_notification_icon', // can not be an url
//         data: {
//             PushTitle: 'CUSTOM NOTIFICATION',
//         },
//     };

//     axios.post(config.onesignale_push_notification_url, notificationData, {
//         headers: {
//             'Authorization': config.authorization,
//             'Content-Type': 'application/json'
//         }
//     }).then(response => {
//         return { code: 1, status: "Notification Sent.", data: "" };
//     }).catch(error => {
//         return { code: 0, status: 'Error sending push notification:', data: "" };
//     });
// }

// graphql
// async function graphql(endpoint, operationName, query, variables) {
//     const headers = {
//         "content-type": "application/json",
//         Authorization: config.graphql_authorization,
//     };
//     const graphqlQuery = {
//         operationName: operationName,
//         query: query,
//         variables: variables,
//     };

//     const options = {
//         method: "POST",
//         headers: headers,
//         body: JSON.stringify(graphqlQuery),
//     };
//     const response1 = await fetch(endpoint, options);
//     const data = await response1.json();
//     if (data.data) {
//         return { code: 1, status: "Success", data: data.data };
//     } else {
//         return { code: 0, status: "Fail", data: [] };
//     }
// };

// whatapp message send
async function whatAppMessageSend(orderData) {
    var recipient = orderData.recipient
    var sendData = getTextMessageInput(recipient, 'Welcome to the Movie Ticket Demo App for Node.js!');
    await sendMessage(sendData);
};

async function sqlQueryResponse(sqlQuery) {
    const responseData = await Model.sequelize.query(sqlQuery, { type: Model.sequelize.QueryTypes.SELECT, });
    if (responseData.length > 0) {
        return { code: 1, data: responseData }
    } else {
        return { code: 0, data: [] }
    }
}

// generate uniquenumber
function generateUniqueNumber() {
    const timestamp = Date.now();
    const randomNumber = Math.floor(Math.random() * 10000);
    return `${timestamp}-${randomNumber}`;
}
// generate otp
function generateOTP() {
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return randomNumber;
}
function searchItem(item, query) {
    return Object.values(item).some(value => {
        if (Array.isArray(value)) {
            return value.some(arrayValue => searchItem(arrayValue, query));
        }

        if (typeof value === 'string' || typeof value === 'number') {
            const stringValue = String(value).toLowerCase();
            return stringValue.includes(query.toLowerCase());
        }

        return false;
    });
}

// search functionality
function searchItems(items, query) {
    const filteredItems = items.filter(item => searchItem(item, query));
    return filteredItems;
}
// pagination function
function paginateResults(results, page, limit) {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedResults = results.slice(startIndex, endIndex);
    return paginatedResults;
}

function getRelationIncludes(originalArray, moduleWhereCondition, subModuleWhereCondition, subSubModuleWhereCondition) {
  if (!originalArray || !Array.isArray(originalArray) || originalArray.length === 0) {
      console.warn("No relations provided or invalid array");  // Log a warning message
      return [];  // Return an empty array to avoid processing
  }

  const includeVar = originalArray.map((item) => {
      if (!item.module || !item.moduleAs) {
          console.warn("Missing required 'module' or 'moduleAs' in relation item");
          return null;  // Skip this item if it's invalid
      }

      var subIncludeVar = [];
      var subSubIncludeVar = [];
      if (item.subSubModule) {
          let subSubWhereClause = item.isSubSubModuleWhereConditionRequired ? buildWhereCondition(subSubModuleWhereCondition) : null;
          subSubIncludeVar.push({ model: Model[item.subSubModule], as: item.subSubModule, required: item.required ? item.required : false, where: subSubWhereClause });
      }
      if (item.subModule) {
          let subWhereClause = item.isSubModuleWhereConditionRequired ? buildWhereCondition(subModuleWhereCondition) : null;
          subIncludeVar.push({ model: Model[item.subModule], as: item.subModuleAs, required: item.required ? item.required : false, include: subSubIncludeVar, where: subWhereClause });
      }

      if (item.subModule1) {
        let subWhereClause = item.isSubModuleWhereConditionRequired ? buildWhereCondition(subModuleWhereCondition) : null;
        subIncludeVar.push({ model: Model[item.subModule1], as: item.subModuleAs1, required: item.required ? item.required : false, include: subSubIncludeVar, where: subWhereClause });
    }

      let whereClause = item.isModuleWhereConditionRequired ? buildWhereCondition(moduleWhereCondition) : null;
      return { model: Model[item.module], as: item.moduleAs, required: item.required ? item.required : false, include: subIncludeVar, where: whereClause }
  });
  return includeVar;
}

// Helper function to process dynamic attributes
function buildSequelizeAttributes(attributes) {
    let sequelizeAttributes = [];

    attributes.forEach(attr => {
        if (attr.type === 'col') {
            // Simple column attribute
            sequelizeAttributes.push([Sequelize.col(attr.column), attr.as]);
        } else if (attr.type === 'fn' && attr.subType) {
            // Aggregate function (like COUNT, SUM, etc.)
            let column = Sequelize.fn(attr.subType, Sequelize.col(attr.column));
            if (attr.castType) {
                column = Sequelize.cast(column, attr.castType || 'DECIMAL'); 
            }
            sequelizeAttributes.push([column, attr.as]);
            // sequelizeAttributes.push([Sequelize.fn(attr.subType, Sequelize.col(attr.column)), attr.as]);
        }
    });

    return sequelizeAttributes;
}



// master create update functions

// unique number create or update function
async function uniqueNumberCreate(inputData, uniqueNo) {
    if (uniqueNo != undefined) {
        const transactionId = uniqueNo.transactionId;
        const field_name = uniqueNo.field_name;
        // command function for unique number
        const uniqueNumberResponse = await uniqueNumberFunction(transactionId);
        if (uniqueNumberResponse.code === 1) {
            inputData[field_name] = uniqueNumberResponse.data;
        }
        return 1;
    } else {
        return 1;
    }
}

// image upload create or update function
async function uploadMediaFile(type, inputData, uploadImages) {
    if (Array.isArray(uploadImages) && uploadImages.length > 0) {
        for (const image of uploadImages) {
            const imageBase64Data = image.imagePath;
            const folderPath = image.folderPath;
            const imageFileName = generateUniqueNumber();
            const fieldName = image.fieldName;

            if (type === 'update') {
                if (isValidBase64Path(imageBase64Data)) {
                    const uploadResponse = await uploadFileFunction(imageBase64Data, folderPath, imageFileName);
                    if (uploadResponse.code === 1) {
                        inputData[fieldName] = uploadResponse.data;
                    }
                } else {
                    inputData[fieldName] = imageBase64Data;
                }
            }

            if (type === 'create') {
                const uploadResponse = await uploadFileFunction(imageBase64Data, folderPath, imageFileName);
                if (uploadResponse.code === 1) {
                    inputData[fieldName] = uploadResponse.data;
                }
            }
        }
        return 1;
    } else {
        return 1;
    }
}

// Update multiple records in a single query
async function updateMultipleRecords(id, relation) {
    try {
        // second means sub module update or create
        const subModelName = relation.subModelName
        const subSubModelName = relation.subSubModelName
        const subModelInputData = relation.subModelInputData
        if (subModelName != undefined || subModelInputData != undefined) {
            await Promise.all(
                subModelInputData.map(async (record) => {
                    // Update or create the record based on the condition
                    record[relation.subModelForeignKey] = id;
                    record.id !== undefined
                        ? await Model[subModelName].update(record, { where: { id: record.id } })
                        : await Model[subModelName].create(record);

                    // sub sub model input data
                    const subSubModelInputData = record.subSubModelInputData
                    if (subSubModelName != undefined || subSubModelInputData != undefined) {
                        const updateSubSubModelResponse =
                            subSubModelInputData.map(record =>
                                record.id != undefined ?
                                    Model[subSubModelName].update(record, { where: { id: record.id } }) :
                                    Model[subSubModelName].create(record)
                            );
                        await Promise.all(updateSubSubModelResponse);
                    }
                })
            );
        }
        return { code: 1, message: "Updated!" }
    } catch (error) {
        console.log("error", error);
        return { code: 0, message: error }
    }
};

// check image base 64 path is valid or not
function isValidBase64Path(path) {
    // Remove any data URL prefixes if present, including different MIME types
    const base64String = path.replace(/^data:[a-zA-Z0-9]+\/[a-zA-Z0-9\-+.]+;base64,/, '');

    // Create a regular expression pattern to match Base64 strings
    const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;

    // Check if the path matches the Base64 pattern
    if (!base64Pattern.test(base64String)) {
        return false;
    }

    // Check if the base64 string can be decoded by attempting to create a buffer
    try {
        Buffer.from(base64String, 'base64');
        return true;
    } catch (error) {
        return false;
    }
}



async function serverSideLoading(sql, start, length, searchValue) {
    var MasterResponse = await Model.sequelize.query(sql, { type: Model.sequelize.QueryTypes.SELECT, });
    if (MasterResponse.length > 0) {
        const recordsTotal = MasterResponse.length;
        // search code
        var isSearch = false;
        if (searchValue != '') {
            isSearch = true;
            const allItems = JSON.parse(JSON.stringify(MasterResponse));
            const searchQuery = searchValue
            MasterResponse = allItems.filter(item => searchItem(item, searchQuery));
        }
        // pagination code
        if (isSearch == false) {
            sql += ` LIMIT ${start}, ${length}`;
            const skuMasterLimitResponse = await Model.sequelize.query(sql, { type: Model.sequelize.QueryTypes.SELECT, });
            MasterResponse = skuMasterLimitResponse
        }
        return {
            code: 1,
            count: recordsTotal,
            data: MasterResponse,
        }
    } else {
        return { code: 0 }
    }
}

async function masterListPaginationFunction(MasterAllDataResponse, pagination, search) {
    const recordLength = MasterAllDataResponse.length;
    // search functionality
    var isSearch = false;
    if (search != undefined) {
        isSearch = true;
        const allItems = JSON.parse(JSON.stringify(MasterAllDataResponse));
        const searchQuery = search.searchName != undefined ? search.searchName : '';
        MasterAllDataResponse = await searchItems(allItems, searchQuery);
    }
    // pagination code
    if (isSearch == false) {
        if (pagination != undefined) {
            const startIndex = pagination.startIndex != undefined ? Number(pagination.startIndex) : 1;; // Starting index
            const length = pagination.itemsPerPage != undefined ? Number(pagination.itemsPerPage) : 10;; // Number of elements to extract
            const limitedArray = MasterAllDataResponse.slice(startIndex, startIndex + length);
            MasterAllDataResponse = limitedArray
        }
    }
    return { recordLength, MasterAllDataResponse }
}

// example();

function getDatesArray(startDateStr, endDateStr) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const datesArray = [];

    // Loop through each date and push into the array
    let currentDate = startDate;
    while (currentDate <= endDate) {
        const formattedDate = currentDate.toISOString().slice(0, 10);
        datesArray.push(formattedDate);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return datesArray;
}

const startDateStr = '2023-07-01';
const endDateStr = '2023-07-21';

const datesArray = getDatesArray(startDateStr, endDateStr);

// The datesArray will contain each date from '2023-07-01' to '2023-07-21' in yyyy-mm-dd format
async function encryptedFunction(password, inputData) {
    try {
        if (!password) {
            return null;
        }
        const { value, field_name } = password;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(value, salt);        
        inputData[field_name] = hashedPassword;
        return 1;
    } catch (err) {
        console.log("err", err);
    }
}

// Common function for search condition
// const getSearchCondition = (search) => {
//     if (search && search.field_name && search.field_name.length > 0 && search.searchKeyword) {
//         return {
//             [Op.or]: search.field_name.map(fieldName => ({
//                 [fieldName]: { [Op.iLike]: `%${search.searchKeyword}%` }
//             }))
//         };
//     }
//     return null;
// };

// const getSearchCondition = (search, includeModels = []) => {
//   if (search && search.field_name && search.field_name.length > 0 && search.searchKeyword) {
//       const conditions = search.field_name.map(fieldName => {
//           const [modelAlias, column] = fieldName.split('.');

//           // If the field contains a model alias (like 'users.first_name')
//           if (column) {

//               if (modelAlias === 'user_exhibitor' && column === 'full_name') {
//                 // Special handling for the virtual 'full_name' field
//                 return Sequelize.where(
//                     Sequelize.fn('concat', Sequelize.col(`${modelAlias}.first_name`), ' ', Sequelize.col(`${modelAlias}.last_name`)),
//                     { [Op.iLike]: `%${search.searchKeyword}%` }
//                 );
//               }

//               // Ensure the includeModels array has the necessary association defined
//               if (!includeModels.includes(modelAlias)) {
//                   includeModels.push(modelAlias); // Add to include list for associations
//               }
//               return { [`$${modelAlias}.${column}$`]: { [Op.iLike]: `%${search.searchKeyword}%` } };
//           }

//           // Handle direct columns on the base table
//           return { [fieldName]: { [Op.iLike]: `%${search.searchKeyword}%` } };
//       });

//       return {
//           [Op.or]: conditions
//       };
//   }

//   return null;
// };

// 1. Get search condition for simple fields (without dot notation)
const getBasicSearchCondition = (fieldName, searchKeyword) => {
  return { [fieldName]: { [Op.iLike]: `%${searchKeyword}%` } };
};

// 2. Get search condition for fields with dot notation (related models)
const getAssociationSearchCondition = (modelAlias, column, searchKeyword, includeModels) => {
    if (!includeModels.includes(modelAlias)) {
      includeModels.push(modelAlias); // Add to include list for associations if not present
    }
  
    // Return the condition with the column casted to text and ILIKE search
    return Sequelize.where(
      Sequelize.literal(`CAST("${modelAlias}"."${column}" AS TEXT)`), 
      { [Op.iLike]: `%${searchKeyword}%` }
    );
  };
  

// 3. Get search condition for full name (concatenation of first_name and last_name)
const getFullNameSearchCondition = (modelAlias, searchKeyword) => {
  return Sequelize.where(
      Sequelize.fn('concat', Sequelize.col(`${modelAlias}.first_name`), ' ', Sequelize.col(`${modelAlias}.last_name`)),
      { [Op.iLike]: `%${searchKeyword}%` }
  );
};

// 4. Main function to create the full search condition
const getSearchCondition = (search, includeModels = []) => {
  if (search && search.field_name && search.field_name.length > 0 && search.searchKeyword) {
      const conditions = search.field_name.map(fieldName => {
          const [modelAlias, column] = fieldName.split('.');

          if (column) {
              // Check if it's a full name search
              if (modelAlias === 'user_exhibitor' && column === 'full_name') {
                  return getFullNameSearchCondition(modelAlias, search.searchKeyword);
              }
              if (modelAlias === 'users' && column === 'full_name') {
                return getFullNameSearchCondition(modelAlias, search.searchKeyword);
            }
              // Handle association fields
              return getAssociationSearchCondition(modelAlias, column, search.searchKeyword, includeModels);
          }

          // Handle simple fields (no dot notation)
          return getBasicSearchCondition(fieldName, search.searchKeyword);
      });

      return {
          [Op.or]: conditions
      };
  }

  return null;
};


// Common function for pagination
const getPagination = (pagination) => {
    let pageSize = 10; // default page size
    let offset = 0; // default offset

    if (pagination && pagination.page && pagination.pageSize) {
        const page = pagination.page; // Get the page number
        pageSize = pagination.pageSize; // Get the page size
        offset = (page - 1) * pageSize;
    } else {
        pageSize = null,
        offset = null
    }

    return { limit: pageSize, offset };
};

function buildWhereCondition(condition) {
    const whereClause = {};

    for (const key in condition) {
        if (condition.hasOwnProperty(key)) {
            const value = condition[key];

            if (typeof value === 'object' && value !== null) {
                // Handle complex operators
                if (value.in) {
                    whereClause[key] = { [Op.in]: value.in };
                }
                if (value.notIn) {
                    whereClause[key] = { [Op.notIn]: value.notIn };
                }
                if (value.like) {
                    whereClause[key] = { [Op.like]: `%${value.like}%` }; // SQL LIKE operator
                }
                if (value.gt) {
                    whereClause[key] = { [Op.gt]: value.gt }; // Greater than
                }
                if (value.lt) {
                    whereClause[key] = { [Op.lt]: value.lt }; // Less than
                }
                if (value.gte) {
                    whereClause[key] = { [Op.gte]: value.gte }; // Greater than or equal
                }
                if (value.lte) {
                    whereClause[key] = { [Op.lte]: value.lte }; // Less than or equal
                }
                if (value.between) {
                    // Apply the BETWEEN operator
                    whereClause[key] = { [Op.between]: value.between };
                }
            } else {
                // Simple equality condition
                whereClause[key] = value;
            }
        }
    }

    return whereClause;
}

async function saveBulkData(data, modelName) {
    const recordsToCreate = [];
    const recordsToUpdate = [];
    
    // Split records into create and update arrays
    for (const element of data) {
        if (element.id) {
            recordsToUpdate.push(element);
        } else {
            recordsToCreate.push(element);
        }
    }

    // Bulk update if there are records to update
    if (recordsToUpdate.length > 0) {
        await Promise.all(recordsToUpdate.map(async (element) => {
            await Model[modelName].update(element, { where: { id: element.id } });
        }));
    }

    // Bulk create if there are records to create
    if (recordsToCreate.length > 0) {
        await Model[modelName].bulkCreate(recordsToCreate);
    }
}

// Function to handle OTP verification
async function verifyMobileNumberWithOTP(mobile_number, otp) {
  const tempUser = await Model["temp_mobile_number_verifications"].findOne({
    where: { mobile_number },
    order: [["createdAt", "DESC"]],
  });

  if (!tempUser) {
    return {status: false, message: "No OTP request found for this mobile number!"}
  }

  if (tempUser.otp_expiry && tempUser.otp_expiry <= new Date()) {
    await tempUser.destroy();
    return {status: false, message: "OTP has expired! Please request a new OTP."}
  }

  if (tempUser.otp != otp) {
    return {status: false, message: "Invalid OTP!"}
  }

  await tempUser.destroy();
  return {status: true, message: "Mobile Number Verified!"}
}

// Mock function to simulate card payment processing
const processCardPayment = async (paymentMethod) => {
  // Simulate some processing time
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock response for successful card payment
  return {
    status: "success", // or 'failed'
    transaction_id: `CARD_${Math.floor(Math.random() * 1000000)}`, // Mock transaction ID
    amount: paymentMethod.amount || 0, // Amount should be defined in paymentMethod
  };
};

const notificationLogs = async function(notificationData, modelName, type) {
    try {
      const { exhibitor_id, barn_manager_id } = notificationData;
  
      if (!exhibitor_id || !barn_manager_id) {
        console.warn("Exhibitor ID or Barn Manager ID not found!");
        return;
      }
  
      // Fetch the username from the users table using exhibitor_id
      const user = await Model.users.findOne({
        where: { id: exhibitor_id }
      });
  
      if (!user) {
        console.warn("User not found for the provided exhibitor ID");
        return;
      }

      if (user.access_level != 'beginner') {
        console.warn("Exhibitor should be beginer, to get the notification!");
        return;
      }

      modelName = convertToTitleCase(modelName);
  
      const username = user.full_name;
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleString(); // Format date as per your needs
  
      // Generate title and description dynamically
      const notification_title = `${type} in ${modelName}`;
      const description = `${username} has ${type} ${modelName} on ${formattedDate}. Please review.`; 
      // Optionally, you can add a link to the module page here if available.
  
      const createObject = {
        exhibitor_id,
        barn_manager_id,
        notification_title,
        description,
      };
      
      // Create the notification log
      await Model.notification_logs.create(createObject);
    } catch (error) {
      console.error(error);
    }
  };

  function singularize(word) {
    // Rule: If word ends with 'ies', replace 'ies' with 'y'
    if (word.endsWith('ies')) {
        return word.slice(0, -3) + 'y';
    }
    // Rule: If word ends with 'es', remove 'es' (exceptions might apply, e.g., "boxes" -> "box")
    else if (word.endsWith('es')) {
        // Special handling for words like "boxes" -> "box"
        if (word.endsWith('xes') || word.endsWith('zes')) {
            return word.slice(0, -2);
        }
        return word.slice(0, -1);
    }
    // Rule: If word ends with 's', remove 's' (e.g., "cats" -> "cat")
    else if (word.endsWith('s')) {
        return word.slice(0, -1);
    }
    // Return the original word if no rules apply
    return word;
}


function convertToTitleCase(input) {
    // Step 1: Replace underscores with spaces
    const replaced = input.replace(/_/g, ' ');

    // Step 2: Singularize the last word
    const words = replaced.split(' ');
    const lastWord = words.pop();
    const singularizedLastWord = singularize(lastWord);

    // Reassemble the string with the singularized last word
    const titleCase = [...words, singularizedLastWord].map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    return titleCase;
}



// Helper function to get date range based on type
const getDateRange = (type) => {
    const today = new Date();
    let start, end = today;
  
    switch (type) {
        case 'monthly':
        case 'quarterly':
            start = new Date(today.getFullYear(), today.getMonth() - 11, 1); // 12 months back
            break;
        case 'yearly':
            start = new Date(today.getFullYear() - 1, 0, 1); // One year back to January 1st
            break;
        default:
            throw new Error('Invalid type specified. Use monthly, quarterly, or yearly.');
    }
  
    return { start, end };
  };
  
  // Function to group records by month
  const groupByMonth = (records) => {
    const grouped = {};
  
    records.forEach(record => {
        // Handle both start_date and log_date as strings (convert to Date)
        const dateField = record.start_date || record.log_date;
        if (!dateField) return;  // Skip records with undefined date fields
  
        const date = new Date(dateField);  // Convert the string date to a Date object
        const month = date.toISOString().slice(0, 7); // YYYY-MM
        const monthName = new Date(month + "-01").toLocaleString('default', { month: 'long' });
  
        if (!grouped[month]) {
            grouped[month] = { month: monthName, data: [] };
        }
        grouped[month].data.push(record);
    });
  
    return Object.values(grouped);
  };
  
  // Function to group records by quarter
  const groupByQuarter = (records) => {
    const grouped = {};
  
    records.forEach(record => {
        // Handle both start_date and log_date as strings (convert to Date)
        const dateField = record.start_date || record.log_date;
        if (!dateField) return;  // Skip records with undefined date fields
  
        const date = new Date(dateField);  // Convert the string date to a Date object
        const month = date.getMonth();
        const quarter = Math.floor(month / 3) + 1; // Quarter is 1-4
        const year = date.getFullYear();
        const key = `${year}-Q${quarter}`;
  
        if (!grouped[key]) {
            grouped[key] = { quarter: key, data: [] };
        }
        grouped[key].data.push(record);
    });
  
    return Object.values(grouped);
  };
  
  // Function to group records by year
  const groupByYear = (records) => {
    const grouped = {};
  
    records.forEach(record => {
        // Handle both start_date and log_date as strings (convert to Date)
        const dateField = record.start_date || record.log_date;
        if (!dateField) return;  // Skip records with undefined date fields
  
        const date = new Date(dateField);  // Convert the string date to a Date object
        const year = date.getFullYear();
  
        if (!grouped[year]) {
            grouped[year] = { year, data: [] };
        }
        grouped[year].data.push(record);
    });
  
    return Object.values(grouped);
  };

  function transformFeedSchduleData(data) {
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

  // Step 2: Return the transformed data as an array
  return Object.values(groupedByAnimal);
}

function transformExerciseScheduleData(data) {
    // Step 1: Group all records by animal_id
    const groupedByAnimal = data.reduce((acc, record) => {
        const animalId = record.animal_id;
        
        if (!acc[animalId]) {
            // Initialize the group with the animal details and an empty exercise array
            acc[animalId] = {
                animal: record.animals, // Assign the animals object
                exercise_array: []       // Empty array for exercise records
            };
        }

        // Add the current exercise record to the exercise array
        acc[animalId].exercise_array.push({
            id: record.id,
            animal_id: record.animal_id,
            excersize_id: record.excersize_id,
            days: record.days,
            timings: record.timings,
            duration: record.duration,
            start_date: record.start_date,
            end_date: record.end_date,
            is_active: record.is_active,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            excersize_masters: record.excersize_masters // Include exercise masters data
        });

        return acc;
    }, {});

    // Step 2: Return the transformed data as an array
    return Object.values(groupedByAnimal);
}

const checkActiveSubscription = async (data, user_id) => {
    if (!data.length) {
        console.error('data length is zero!');
        return;
    }

    // fetch the user subscribed plan
    const mostRecentSubscription = await Model.user_subscriptions.findOne({
        where: {
        user_id: user_id,
        subscription_status: 'Active',
        actual_end_date: {
            [Op.gte]: new Date(),
        },
        },
        order: [['createdAt', 'DESC']],
    });

    if (!mostRecentSubscription) {
        console.error("No subscription found for this user!");
        return;
    }
    
    // Update all records in the data array
    data.forEach(element => {
        if (mostRecentSubscription.subscription_id === element.id) {
            // Replace the content of the element with the mostRecentSubscription.meta_data
            element.dataValues = {
                ...mostRecentSubscription.meta_data,
                active_subscription: true, // Add active_subscription flag
            };
        } else {
            // Set active_subscription to false for unmatched records
            element.dataValues.active_subscription = false;
        }
    });

    return data;
};

function processBulkUpload(payload) {
    if (payload.commanBulkUpload) {
        // Extracting the bulk field name and the inputData array
        const bulkField = payload.commanBulkUpload; 
        const inputData = payload.inputData[0]; // Since inputData is an array, we assume the first object

        // Extract the animal_ids and other data to clone
        const animalIds = inputData[bulkField];

        // Map through animalIds and create new entries for each one
        const newInputData = animalIds.map(animal_id => {
            // Create a clone of inputData and replace animal_id with the current animal_id in the loop
            return {
                ...inputData,
                animal_id: animal_id // Assigning the current animal_id to each entry
            };
        });

        // Replace inputData in the payload with new transformed data
        return newInputData
    }
    return payload.inputData; // If no bulk upload, return payload as is
}

function replacePlaceholders(payload) {
    const replaceRecursively = (obj) => {
        if (typeof obj === 'object' && obj !== null) {
            // Iterate through each key in the object
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    // Recursively call replaceRecursively for nested objects
                    obj[key] = replaceRecursively(obj[key]);
                }
            }
            return obj;
        } else if (typeof obj === 'string') {
            // If the value is a string and replace_status is true, check for placeholders
            if (payload.replace_status) {
                return obj.replace(/%%([^%]+)%%/g, (match, placeholder) => {
                    switch (placeholder) {
                        case 'todays_date':
                            return moment().format('YYYY-MM-DD'); // Replace with today's date
                        // You can add more cases here for other placeholders in the future
                        default:
                            return match; // Return the original placeholder if not matched
                    }
                });
            }
            return obj; // Return the original string if replace_status is not true
        }
        return obj;
    };

    return replaceRecursively(payload);
}

async function replacePlaceholdersForSaveRecords(payload) {
    const replaceRecursively = async (obj) => {
        if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    obj[key] = await replaceRecursively(obj[key]);
                }
            }
            return obj;
        } else if (typeof obj === 'string') {
            if (payload.replace_status) {
                const matches = [...obj.matchAll(/%%([^%]+)%%/g)]; // Extract all placeholders
                for (const match of matches) {
                    const [placeholder, key] = match; // `placeholder` is "%%key%%", `key` is "key"
                    let replacement;

                    switch (key) {
                        case 'todays_date':
                            replacement = moment().format('YYYY-MM-DD');
                            break;

                        case 'free_trial_days':
                            const data = await Model.configurations.findOne({ where: { is_active: 'Active' } });
                            if (data && data.free_trial_days) {
                                replacement = moment().add(data.free_trial_days, 'days').format('YYYY-MM-DD');
                            } else {
                                replacement = placeholder; // Keep original if no data found
                            }
                            break;

                        default:
                            replacement = placeholder; // Keep original for unknown placeholders
                    }

                    obj = obj.replace(placeholder, replacement);
                }
            }
            return obj;
        }
        return obj;
    };

    return await replaceRecursively(payload);
}


function buildOrderBy(orderBy) {
    const { field, order } = orderBy;

    // Check if the field contains a '.'
    if (!field.includes('.')) {
        return [[field, order.toUpperCase()]]; // Directly use field name and order
    }
  
    // Split field to handle model and field separately
    const [model, ...fieldParts] = field.split('.');
    const fieldName = fieldParts.join('.'); // In case the field name has a dot (e.g. "posts.title")

    // Handle special case for full_name (concatenation of first_name and last_name)
    if (model === 'users' && fieldName === 'full_name') {
        return [
        [
            Sequelize.literal(`CONCAT(users.first_name, ' ', users.last_name)`), 
            order.toUpperCase()
        ]
        ];
    }
  
    // Return the order structure for Sequelize
    return [[
      { model: Model[model], as: model }, // Specify model and alias
      fieldName,
      order.toUpperCase()
    ]];
  }


  const twilio = require('twilio');
  
  // Create a reusable function for sending SMS
async function sendSMS (to, messageBody) {
    try {
        // Load these values from environment variables for better security
        const accountSid = process.env.TWILIO_ACCOUNT_SID; // Your Account SID from www.twilio.com/console
        const authToken = process.env.TWILIO_AUTH_TOKEN;   // Your Auth Token from www.twilio.com/console

        // Validate that the environment variables are present
        if (!accountSid || !authToken || !process.env.TWILIO_PHONE_NUMBER) {
            return {
            success: false,
            error: 'Missing Twilio configuration: Make sure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are set in the environment.'
            };
        }

        const client = twilio(accountSid, authToken);      // Create Twilio client

        const message = await client.messages.create({
            body: messageBody,          // The message to send
            from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio number
            to: to                      // The recipient's phone number
        });
        return { success: true, messageSid: message.sid };  // Return success with message SID
    } catch (error) {
      console.error('Error sending SMS:', error.message);
      return { success: false, error: error.message };  // Return failure with error
    }
  };

  async function sendLoginOTPEmail(otp,minutes,email) {
    const subject = "Your OTP for Logging Into BarnBook";
    let body = "Dear [User's Name],";  
    body = "Dear User,<br /><br />";  
    body += "We have received a request to log in to your BarnBook account.<br />";
    body += "To verify your identity, please use the following One-Time Password (OTP):<br />";
    body += "OTP: "+otp+"<br />";
    body += "This OTP is valid for the next "+minutes+" minutes. If you did not request this, please ignore this email or contact our support team for assistance.<br />";
    body += "For security reasons, please do not share this OTP with anyone.<br />";
    body += "Thank you for using BarnBook.";
    console.log("body",body);
    await sendMailFunction(email, subject, body, "", "");
  }

  function hasSpecificValues(arrayOfObjects, criteria) {
    // Helper function to get the value at a nested key path
    const getValueByPath = (obj, path) => {
      return path.split('.').reduce((acc, key) => acc && acc[key], obj);
    };
  
    // Iterate through each key-value pair in the criteria
    for (const [keyPath, expectedValue] of Object.entries(criteria)) {
      let found = false;
  
      // Check each object in the array for the key-path-value match
      for (const obj of arrayOfObjects) {
        const value = getValueByPath(obj, keyPath);
        if (value === expectedValue) {
          found = true;
          break;
        }
      }
  
      // If any key-path-value pair is not found, return false
      if (!found) return false;
    }
  
    // If all key-path-value pairs are found, return true
    return true;
  }
  


module.exports = {
    uniqueNumberFunction, generateUniqueNumber, generateOTP, uploadFileFunction, sendMailFunction, searchItems, paginateResults, sqlQueryResponse, getRelationIncludes, isValidBase64Path, updateMultipleRecords,
    uploadMediaFile, uniqueNumberCreate, serverSideLoading, masterListPaginationFunction, getDatesArray, encryptedFunction,
    getPagination, getSearchCondition, buildWhereCondition, saveBulkData, verifyMobileNumberWithOTP, processCardPayment, notificationLogs, buildSequelizeAttributes, 
    getDateRange, groupByMonth, groupByQuarter, groupByYear, transformFeedSchduleData, transformExerciseScheduleData, processBulkUpload, replacePlaceholders,replacePlaceholdersForSaveRecords, buildOrderBy, sendSMS, checkActiveSubscription,
    hasSpecificValues,sendLoginOTPEmail
};