const Model = require("../../models");
var commonfunction = require("../commanfunction/commanfunction.controller");
var response = require("../../middleware/response.middleware");
const { Op, fn, col, literal, cast } = require("sequelize");
const sequelize = require("sequelize");
const moment = require('moment'); 
const { success, fail, catchError, vaildationError } = response; // Assuming response.js is the file with the methods

// Fetch total revenue grouped by subscription_id and include the interval
// const fetchTotalRevenue = async () => {
//     try {
//       const totalRevenueBySubscription = await Model.user_subscriptions.findAll({
//         include: [
//           {
//             model: Model.subscriptions,
//             as: 'subscriptions', // Alias for subscriptions
//             attributes: [
//               [col('interval'), 'subscription_interval'] // Alias interval as subscription_interval
//             ] 
//           }
//         ],
//         attributes: [
//           'subscription_id', // Include the subscription_id to group by
//           [fn('SUM', cast(col('subscriptions.discounted_amount'), 'DECIMAL')), 'total_revenue'] // Calculate total revenue
//         ],
//         group: ['subscription_id', 'subscriptions.id'], // Group by subscription_id and the actual subscription
//         raw: true // Get plain JavaScript objects
//       });
  
//       return totalRevenueBySubscription; // Return the result
//     } catch (error) {
//       console.error('Error fetching total revenue by subscription:', error);
//       throw error; // Handle the error properly
//     }
//   };


exports.getTotalRevenue = async (req, res) => {
  try {
    // Query to fetch total revenue
    const query = `
      SELECT 
          us.subscription_id, 
          us.meta_data->>'interval' AS subscription_interval, 
          SUM(CAST(us.meta_data->>'discounted_amount' AS DECIMAL)) AS total_revenue
      FROM 
          user_subscriptions us
      INNER JOIN 
          subscriptions s ON us.subscription_id = s.id
      WHERE 
          us.meta_data->>'interval' IS NOT NULL 
          AND us.meta_data->>'discounted_amount' IS NOT NULL
      GROUP BY 
          us.subscription_id, 
          us.meta_data->>'interval', 
          s.id;
    `;

    // Execute the query
    const results = await Model.sequelize.query(query, {
      type: Model.sequelize.QueryTypes.SELECT,
    });

    // Success response
    return response.success(res, 'Total revenue fetched successfully!', results);
  } catch (error) {
    console.error('Error fetching total revenue:', error);

    // Error response
    return response.catchError(res, 'Error occurred while fetching total revenue', error);
  }
};


// Controller function to handle the request
// exports.getTotalRevenue = async (req, res) => {
//   try {
//     const totalRevenue = await fetchTotalRevenue();

//     // Return success response
//     return success(res, 'Total revenue fetched successfully', { total_revenue: totalRevenue });
//   } catch (error) {
//     console.error('Error in getTotalRevenue controller:', error);

//     // Return failure response in case of an error
//     return catchError(res, 'Failed to fetch total revenue', error, 'user_subscriptions');
//   }
// };

// Controller to get User Acquisition Report
// exports.getUserAcquisitionReport = async (req, res) => {
//   try {
//     // Get date range from query params or set default values
//     const { startDate, endDate } = req.body;
//     const start = startDate; // Default start date
//     const end = endDate;     // Default end date

//     // Run the query using Sequelize syntax with aliases
//     const userAcquisitionData = await Model.users.findAll({
//       attributes: [
//         'id',
//         'first_name',
//         'last_name',
//         'createdAt',
//         [
//           Model.sequelize.literal(`
//             CASE 
//               WHEN free_trials.user_id IS NOT NULL THEN 'Free Trial'
//               WHEN user_subscriptions.user_id IS NOT NULL THEN 'Paid Subscription'
//               ELSE 'No Subscription'
//             END
//           `),
//           'signup_type'
//         ]
//       ],
//       include: [
//         {
//           model: Model.free_trials,
//           as: 'free_trials',  // Alias same as model name
//           attributes: [],      // We don't need free_trial fields in the result
//           required: false      // Left join
//         },
//         {
//           model: Model.user_subscriptions,
//           as: 'user_subscriptions',  // Alias same as model name
//           attributes: [],            // We don't need user_subscription fields in the result
//           required: false            // Left join
//         }
//       ],
//       where: {
//         createdAt: {
//           [Op.between]: [start, end]
//         }
//       },
//       group: ['users.id', 'free_trials.user_id', 'user_subscriptions.user_id'],
//       having: Model.sequelize.literal(`
//         (free_trials.user_id IS NOT NULL OR user_subscriptions.user_id IS NOT NULL)
//       `), // Exclude records with 'No Subscription'
//       order: [['createdAt', 'ASC']]
//     });

//     // If data found, return with success
//     if (userAcquisitionData && userAcquisitionData.length > 0) {
//       return response.success(res, "User Acquisition Report fetched successfully", userAcquisitionData, userAcquisitionData.length);
//     } else {
//       return response.fail(res, "No data found within the specified date range", []);
//     }

//   } catch (error) {
//     // Handle errors with catchError utility
//     console.error('Error fetching user acquisition report:', error);
//     return response.catchError(res, "An error occurred while fetching the user acquisition report", error.message, 'UserAcquisitionReport');
//   }
// };


// exports.getUserAcquisitionReport = async (req, res) => {
//   try {
//     // Get date range from query params or set default values
//     const { startDate, endDate, orderByModel, pagination, search } = req.body;

//     console.log("Received Payload:", req.body);

//     // Pagination setup
//     const page = pagination?.page || 1;
//     const pageSize = pagination?.pageSize || 10;
//     const offset = (page - 1) * pageSize;
//     const limit = pageSize;

//     // Search functionality
//     let searchCondition = '';
//     let searchParams = [];
//     if (search?.searchKeyword && search?.field_name?.length > 0) {
//       const searchQueries = search.field_name.map(field => {
//         searchParams.push(`%${search.searchKeyword}%`);
//         return `CAST(${field} AS TEXT) LIKE ?`;  // Cast to TEXT before using LIKE
//       });
//       searchCondition = `AND (${searchQueries.join(' OR ')})`;
//     }    

//     // Ordering setup
//     const orderByField = orderByModel?.field || 'users."createdAt"'; // Default order by 'createdAt'
//     const orderDirection = orderByModel?.order?.toUpperCase() || 'ASC'; // Default order direction 'ASC'

//     // Raw SQL query construction
//     const query = `
//       SELECT 
//         users.id,
//         users.first_name,
//         users.last_name,
//         users."createdAt",
//         CASE 
//           WHEN free_trials.user_id IS NOT NULL THEN 'Free Trial'
//           WHEN user_subscriptions.user_id IS NOT NULL THEN 'Paid Subscription'
//           ELSE 'No Subscription'
//         END AS signup_type
//       FROM users
//       LEFT JOIN free_trials ON free_trials.user_id = users.id
//       LEFT JOIN user_subscriptions ON user_subscriptions.user_id = users.id
//       WHERE users."createdAt" BETWEEN ? AND ?
//       ${searchCondition}
//       GROUP BY users.id, free_trials.user_id, user_subscriptions.user_id
//       HAVING free_trials.user_id IS NOT NULL OR user_subscriptions.user_id IS NOT NULL
//       ORDER BY ${orderByField} ${orderDirection}
//       LIMIT ? OFFSET ?;
//     `;

//     // Prepare parameters for the query
//     const params = [startDate, endDate, ...searchParams, limit, offset];

//     // Execute the query
//     const userAcquisitionData = await Model.sequelize.query(query, {
//       replacements: params,
//       type: Model.sequelize.QueryTypes.SELECT,
//     });

//     console.log("Generated Query Result:", userAcquisitionData);

//     // If data found, return with success
//     if (userAcquisitionData && userAcquisitionData.length > 0) {
//       return response.success(res, "User Acquisition Report fetched successfully", userAcquisitionData, userAcquisitionData.length);
//     } else {
//       return response.fail(res, "No data found within the specified date range", []);
//     }

//   } catch (error) {
//     // Handle errors with catchError utility
//     console.error('Error fetching user acquisition report:', error);
//     return response.catchError(res, "An error occurred while fetching the user acquisition report", error.message, 'UserAcquisitionReport');
//   }
// };

// Controller to get User Acquisition Report

// exports.getUserAcquisitionReport = async (req, res) => {
//   try {
//     // Get query params or set default values
//     const { startDate, endDate, pagination, orderByModel, search } = req.body;
//     const start = startDate; // Default start date
//     const end = endDate;     // Default end date

//     // Pagination
//     const { page = 1, pageSize = 10 } = pagination;
//     const offset = (page - 1) * pageSize;
//     const limit = pageSize; 

//     // Order
//     const { field = 'users.createdAt', order = 'ASC' } = orderByModel;
//     const [modelName, columnName] = field.split('.');
//     const orderByField = `${modelName}."${columnName}"`;
//     const orderDirection = order.toUpperCase(); // Default order direction 'ASC'


//     // Searching
//     const { field_name = [], searchKeyword = '' } = search;
//     const searchConditions = field_name.map(field => `
//       CAST(${field} AS TEXT) LIKE '%${searchKeyword}%'
//     `).join(' OR ');    

//     // Run the raw query
//     const userAcquisitionData = await Model.sequelize.query(`
//       SELECT 
//         users.id,
//         users.first_name,
//         users.last_name,
//         users."createdAt",
//         CASE 
//           WHEN free_trials.user_id IS NOT NULL THEN 'Free Trial'
//           WHEN user_subscriptions.user_id IS NOT NULL THEN 'Paid Subscription'
//           ELSE 'No Subscription'
//         END AS signup_type
//       FROM 
//         users
//       LEFT JOIN 
//         free_trials ON users.id = free_trials.user_id
//       LEFT JOIN 
//         user_subscriptions ON users.id = user_subscriptions.user_id
//       WHERE 
//         users."createdAt" BETWEEN :start AND :end
//         AND (${searchConditions})
//       GROUP BY 
//         users.id, free_trials.user_id, user_subscriptions.user_id
//       HAVING 
//         free_trials.user_id IS NOT NULL OR user_subscriptions.user_id IS NOT NULL
//       ORDER BY ${orderByField} ${orderDirection}
//       LIMIT :limit OFFSET :offset
//     `, {
//       replacements: { start, end, limit, offset },
//       type: Model.sequelize.QueryTypes.SELECT
//     });

//     // Count total records for pagination
//     const totalRecords = await Model.sequelize.query(`
//       SELECT COUNT(*) AS total
//       FROM (
//         SELECT users.id
//         FROM 
//           users
//         LEFT JOIN 
//           free_trials ON users.id = free_trials.user_id
//         LEFT JOIN 
//           user_subscriptions ON users.id = user_subscriptions.user_id
//         WHERE 
//           users."createdAt" BETWEEN :start AND :end
//           AND (${searchConditions})
//         GROUP BY 
//           users.id
//         HAVING 
//           COUNT(free_trials.user_id) > 0 
//           OR COUNT(user_subscriptions.user_id) > 0
//       ) AS subquery
//     `, {
//       replacements: { start, end },
//       type: Model.sequelize.QueryTypes.SELECT
//     });


//     const total = totalRecords?.[0]?.total || 0;
        
//     // Calculate total page
//     const totalPage = limit > 0 ? Math.ceil(total / limit) : 0;
    
//     // If data found, return with success
//     if (userAcquisitionData && userAcquisitionData.length > 0) {
//       return response.success(res, "User Acquisition Report fetched successfully", userAcquisitionData,  total, totalPage);
//     } else {
//       return response.fail(res, "No data found within the specified date range", []);
//     }

//   } catch (error) {
//     // Handle errors with catchError utility
//     console.error('Error fetching user acquisition report:', error);
//     return response.catchError(res, "An error occurred while fetching the user acquisition report", error.message, 'UserAcquisitionReport');
//   }
// };

exports.getUserAcquisitionReport = async (req, res) => {
  try {
    const payload = req.body;

    // Extract payload details
    const startDate = payload.startDate || '1900-01-01';
    const endDate = payload.endDate || '2100-01-01';
    const page = payload.pagination?.page || 1;
    const pageSize = payload.pagination?.pageSize || 10;
    const searchKeyword = payload.search?.searchKeyword || '';
    const orderByField = payload.orderByModel?.field || 'users.id';
    const orderDirection = payload.orderByModel?.order || 'ASC';

    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    // Build dynamic search conditions
    const searchFields = payload.search?.field_name || [];
    const searchCondition = searchFields
      .map((field) => `${field} ILIKE :searchKeyword`)
      .join(' OR ');

    const today = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format

    // Main query
    const query = `
      SELECT DISTINCT ON (u.id)
          u.id AS user_id,
          u.first_name,
          u.last_name,
          CONCAT(u.first_name, ' ', u.last_name) AS full_name,
          u.email,
          u.mobile_number,
          CASE
              WHEN us.id IS NOT NULL THEN 'Paid Subscription'
              WHEN ft.id IS NOT NULL THEN 'Free Trial'
          END AS signup_type,
          COALESCE(us.start_date, ft.start_date) AS start_date,
          COALESCE(us.end_date, ft.end_date) AS end_date
      FROM 
          users u
      LEFT JOIN 
          user_subscriptions us 
          ON u.id = us.user_id 
          AND us.actual_end_date >= :today 
          AND us.subscription_status = 'Active'
      LEFT JOIN 
          free_trials ft 
          ON u.id = ft.user_id 
          AND ft.end_date >= :today 
      WHERE 
          u."createdAt" BETWEEN :startDate AND :endDate
          AND (us.id IS NOT NULL OR ft.id IS NOT NULL)
          ${searchCondition ? `AND (${searchCondition})` : ''}
      ORDER BY 
          u.id, ${orderByField} ${orderDirection}
      LIMIT :limit OFFSET :offset;
    `;

    // Count query
    const countQuery = `
      SELECT 
          COUNT(DISTINCT u.id) AS total_count
      FROM 
          users u
      LEFT JOIN 
          user_subscriptions us 
          ON u.id = us.user_id 
          AND us.actual_end_date >= :today 
          AND us.subscription_status = 'Active'
      LEFT JOIN 
          free_trials ft 
          ON u.id = ft.user_id 
          AND ft.end_date >= :today 
      WHERE 
          u."createdAt" BETWEEN :startDate AND :endDate
          AND (us.id IS NOT NULL OR ft.id IS NOT NULL)
          ${searchCondition ? `AND (${searchCondition})` : ''};
    `;

    // Execute main query
    const results = await Model.sequelize.query(query, {
      replacements: {
        today,
        startDate,
        endDate,
        searchKeyword: `%${searchKeyword}%`,
        limit,
        offset,
      },
      type: Model.sequelize.QueryTypes.SELECT,
    });

    // Execute count query
    const countResult = await Model.sequelize.query(countQuery, {
      replacements: {
        today,
        startDate,
        endDate,
        searchKeyword: `%${searchKeyword}%`,
      },
      type: Model.sequelize.QueryTypes.SELECT,
    });

    const totalRecords = countResult[0]?.total_count || 0;
    const totalPages = Math.ceil(totalRecords / pageSize);

    // Success response
    return response.success(
      res,
      'User acquisition report fetched successfully!',
      results,
      totalRecords,
      totalPages
    );
  } catch (error) {
    console.error('Error generating user acquisition report:', error);

    // Error response
    return response.catchError(
      res,
      'Error occurred while generating user acquisition report',
      error
    );
  }
};



// 2: Free Trial Listing
exports.getFreeTrialsWithUsers = async (req, res) => {
  try {
    const payload = req.body;

    // Extract values from the payload
    const searchKeyword = payload.search?.searchKeyword || '';
    const page = payload.pagination?.page || 1;
    const pageSize = payload.pagination?.pageSize || 10;
    const orderByField = payload.orderByModel?.field  ?? 'ft.id';
    const orderDirection = payload.orderByModel?.order || 'ASC';

    // Calculate pagination offsets
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    // Static query to fetch the data
    const query = `
        SELECT 
            ft.*,
            json_build_object(
                'id', u.id,
                'full_name', CONCAT(u.first_name, ' ', u.last_name),
                'email', u.email,
                'mobile_number', u.mobile_number
            ) AS users,
            CASE 
                WHEN ft.end_date >= CURRENT_DATE THEN 'active'
                ELSE 'expired'
            END AS status
        FROM 
            free_trials ft
        LEFT JOIN 
            users u 
        ON 
            ft.user_id = u.id
        WHERE 
            NOT EXISTS (
                SELECT 
                    1
                FROM 
                    user_subscriptions us
                WHERE 
                    us.user_id = ft.id
                    AND us.subscription_status = 'Active'
                    AND us.actual_end_date >= CURRENT_DATE
            )
            AND (
                CONCAT(u.first_name, ' ', u.last_name) ILIKE :searchKeyword OR 
                u.email ILIKE :searchKeyword OR 
                u.mobile_number ILIKE :searchKeyword OR 
                TO_CHAR(ft.start_date, 'YYYY-MM') ILIKE :searchKeyword OR 
                TO_CHAR(ft.end_date, 'YYYY-MM') ILIKE :searchKeyword OR 
                ft.status::text ILIKE :searchKeyword OR
                u.id::text ILIKE :searchKeyword 
            )
        ORDER BY 
            ${orderByField} ${orderDirection}
        LIMIT :limit OFFSET :offset;
    `;

    // Static query to count total records
    const countQuery = `
        SELECT 
            COUNT(*) AS total_count
        FROM 
            free_trials ft
        LEFT JOIN 
            users u 
        ON 
            ft.user_id = u.id
        WHERE 
            NOT EXISTS (
                SELECT 
                    1
                FROM 
                    user_subscriptions us
                WHERE 
                    us.user_id = ft.id
                    AND us.subscription_status = 'Active'
                    AND us.actual_end_date >= CURRENT_DATE
            )
            AND (
                CONCAT(u.first_name, ' ', u.last_name) ILIKE :searchKeyword OR 
                u.email ILIKE :searchKeyword OR 
                u.mobile_number ILIKE :searchKeyword OR 
                TO_CHAR(ft.start_date, 'YYYY-MM') ILIKE :searchKeyword OR 
                TO_CHAR(ft.end_date, 'YYYY-MM') ILIKE :searchKeyword OR 
                ft.status::text ILIKE :searchKeyword OR
                u.id::text ILIKE :searchKeyword 

            );
    `;

    // Execute the queries
    const results = await Model.sequelize.query(query, {
      replacements: {
        searchKeyword: `%${searchKeyword}%`,
        limit,
        offset,
      },
      type: sequelize.QueryTypes.SELECT,
    });

    const countResult = await Model.sequelize.query(countQuery, {
      replacements: {
        searchKeyword: `%${searchKeyword}%`,
      },
      type: sequelize.QueryTypes.SELECT,
    });

    const count = countResult[0]?.total_count || 0;
    const totalPage = Math.ceil(count / pageSize);

    return response.success(res, "Data fetched successfully!", results, count, totalPage);
  } catch (error) {
    console.error('Error fetching free trials:', error);
    return response.catchError(res, "Error occurred", error);
  }
};

exports.getExpiredSubscriptions = async (req, res) => {
  try {
      const payload = req.body;

      // Extract pagination, search, and orderBy details
      const page = payload.pagination?.page || 1;
      const pageSize = payload.pagination?.pageSize || 10;
      const offset = (page - 1) * pageSize;
      const limit = pageSize;
      const searchKeyword = payload.search?.searchKeyword || '';
      const orderByField = payload.orderByModel?.field || 'us.id';
      const orderDirection = payload.orderByModel?.order || 'asc';

      // Main query
      const query = `
          SELECT 
              us.*, 
              json_build_object(
                  'id', u.id,
                  'full_name', CONCAT(u.first_name, ' ', u.last_name),
                  'email', u.email,
                  'mobile_number', u.mobile_number
              ) AS users,
              json_build_object(
                  'id', s.id,
                  'subscriptions_title', s.subscriptions_title,
                  'subscriptions_tag', s.subscriptions_tag,
                  'subscriptions_amount', s.subscriptions_amount,
                  'discounted_amount', s.discounted_amount
              ) AS subscription_details
          FROM 
              user_subscriptions us
          JOIN 
              users u ON us.user_id = u.id
          JOIN 
              subscriptions s ON us.subscription_id = s.id
          WHERE 
              us.actual_end_date < CURRENT_DATE AND 
              us.subscription_status != 'Active' AND 
              (
                  u.id::text ILIKE :searchKeyword OR 
                  us.start_date::text ILIKE :searchKeyword OR 
                  us.end_date::text ILIKE :searchKeyword OR 
                  us.actual_end_date::text ILIKE :searchKeyword OR 
                  CONCAT(u.first_name, ' ', u.last_name) ILIKE :searchKeyword OR 
                  u.email ILIKE :searchKeyword OR 
                  u.mobile_number ILIKE :searchKeyword OR 
                  s.subscriptions_title ILIKE :searchKeyword OR 
                  s.subscriptions_tag ILIKE :searchKeyword OR 
                  s.subscriptions_amount::text ILIKE :searchKeyword OR 
                  s.discounted_amount::text ILIKE :searchKeyword
              )
          ORDER BY 
              ${orderByField} ${orderDirection}
          LIMIT :limit OFFSET :offset;
      `;

      // Query for total count
      const countQuery = `
          SELECT 
              COUNT(*) AS total_count
          FROM 
              user_subscriptions us
          JOIN 
              users u ON us.user_id = u.id
          JOIN 
              subscriptions s ON us.subscription_id = s.id
          WHERE 
              us.actual_end_date < CURRENT_DATE AND 
              us.subscription_status != 'Active' AND 
              (
                  u.id::text ILIKE :searchKeyword OR 
                  us.start_date::text ILIKE :searchKeyword OR 
                  us.end_date::text ILIKE :searchKeyword OR 
                  us.actual_end_date::text ILIKE :searchKeyword OR 
                  CONCAT(u.first_name, ' ', u.last_name) ILIKE :searchKeyword OR 
                  u.email ILIKE :searchKeyword OR 
                  u.mobile_number ILIKE :searchKeyword OR 
                  s.subscriptions_title ILIKE :searchKeyword OR 
                  s.subscriptions_tag ILIKE :searchKeyword OR 
                  s.subscriptions_amount::text ILIKE :searchKeyword OR 
                  s.discounted_amount::text ILIKE :searchKeyword
              );
      `;

      // Execute main query
      const results = await Model.sequelize.query(query, {
          replacements: {
              searchKeyword: `%${searchKeyword}%`,
              limit,
              offset,
          },
          type: sequelize.QueryTypes.SELECT,
      });

      // Execute count query
      const countResult = await Model.sequelize.query(countQuery, {
          replacements: {
              searchKeyword: `%${searchKeyword}%`,
          },
          type: sequelize.QueryTypes.SELECT,
      });

      const totalRecords = countResult[0]?.total_count || 0;
      const totalPages = Math.ceil(totalRecords / pageSize);

      return response.success(res, "Expired subscriptions fetched successfully!", results, totalRecords, totalPages);
  } catch (error) {
      console.error('Error fetching expired subscriptions:', error);
      return response.catchError(res, "Error occurred while fetching expired subscriptions.", error);
  }
};

exports.churnRateReport = async (req, res) => {
  try {
    const payload = req.body;

    // Extract values from payload
    const searchKeyword = payload.search?.searchKeyword || '';
    const page = payload.pagination?.page || 1;
    const pageSize = payload.pagination?.pageSize || 10;
    const orderByField =
      payload.orderByModel?.field
        ? payload.orderByModel?.field
        : 'us.id';
    const orderDirection = payload.orderByModel?.order || 'ASC';

    // Calculate pagination offsets
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    // Build query for fetching churned subscriptions
    const query = `
      SELECT 
          us.*,
          json_build_object(
              'id', u.id,
              'full_name', CONCAT(u.first_name, ' ', u.last_name),
              'email', u.email,
              'mobile_number', u.mobile_number
          ) AS users
      FROM 
          user_subscriptions us
      JOIN 
          users u ON us.user_id = u.id
      WHERE 
          us.actual_end_date < CURRENT_DATE
          AND us.actual_end_date BETWEEN :startDate AND :endDate
          AND us.subscription_status != 'Active'
          AND (
              us.start_date::TEXT ILIKE :searchKeyword OR 
              us.end_date::TEXT ILIKE :searchKeyword OR 
              us.actual_end_date::TEXT ILIKE :searchKeyword OR 
              CONCAT(u.first_name, ' ', u.last_name) ILIKE :searchKeyword OR 
              u.email ILIKE :searchKeyword OR 
              u.mobile_number ILIKE :searchKeyword OR 
              us.meta_data->>'subscriptions_title' ILIKE :searchKeyword OR 
              us.meta_data->>'interval' ILIKE :searchKeyword OR 
              us.meta_data->>'subscriptions_tag' ILIKE :searchKeyword OR 
              us.meta_data->>'subscriptions_amount' ILIKE :searchKeyword OR 
              us.meta_data->>'discounted_amount' ILIKE :searchKeyword
          )
      ORDER BY 
          ${orderByField} ${orderDirection}
      LIMIT :limit OFFSET :offset;
    `;

    // Query to count total records
    const countQuery = `
      SELECT 
          COUNT(*) AS total_count
      FROM 
          user_subscriptions us
      INNER JOIN 
          users u ON us.user_id = u.id
      WHERE 
          us.actual_end_date < CURRENT_DATE
          AND us.actual_end_date BETWEEN :startDate AND :endDate
          AND us.subscription_status != 'Active'
          AND (
              us.start_date::TEXT ILIKE :searchKeyword OR 
              us.end_date::TEXT ILIKE :searchKeyword OR 
              us.actual_end_date::TEXT ILIKE :searchKeyword OR 
              CONCAT(u.first_name, ' ', u.last_name) ILIKE :searchKeyword OR 
              u.email ILIKE :searchKeyword OR 
              u.mobile_number ILIKE :searchKeyword OR 
              us.meta_data->>'subscriptions_title' ILIKE :searchKeyword OR 
              us.meta_data->>'subscriptions_tag' ILIKE :searchKeyword OR 
              us.meta_data->>'subscriptions_amount' ILIKE :searchKeyword OR 
              us.meta_data->>'discounted_amount' ILIKE :searchKeyword
          );
    `;

    // Execute the main query
    const results = await Model.sequelize.query(query, {
      replacements: {
        searchKeyword: `%${searchKeyword}%`,
        startDate: payload.whereCondition?.actual_end_date?.between?.[0] || '1900-01-01',
        endDate: payload.whereCondition?.actual_end_date?.between?.[1] || '2100-01-01',
        limit,
        offset,
      },
      type: Model.sequelize.QueryTypes.SELECT,
    });

    // Execute the count query
    const countResult = await Model.sequelize.query(countQuery, {
      replacements: {
        searchKeyword: `%${searchKeyword}%`,
        startDate: payload.whereCondition?.actual_end_date?.between?.[0] || '1900-01-01',
        endDate: payload.whereCondition?.actual_end_date?.between?.[1] || '2100-01-01',
      },
      type: Model.sequelize.QueryTypes.SELECT,
    });

    const totalRecords = countResult[0]?.total_count || 0;
    const totalPages = Math.ceil(totalRecords / pageSize);

    // Success response
    return response.success(
      res,
      'Churn rate report fetched successfully!',
      results,
      totalRecords,
      totalPages
    );
  } catch (error) {
    console.error('Error generating churn rate report:', error);

    // Error response
    return response.catchError(
      res,
      'Error occurred while generating churn rate report',
      error
    );
  }
};

exports.trialConversionReport = async (req, res) => {
  try {
    const payload = req.body;

    // Extract values from payload
    const searchKeyword = payload.search?.searchKeyword || '';
    const page = payload.pagination?.page || 1;
    const pageSize = payload.pagination?.pageSize || 10;
    const orderByField =
      payload.orderByModel?.field
        ? payload.orderByModel?.field
        : 'us.id';
    const orderDirection = payload.orderByModel?.order || 'ASC';

    // Calculate pagination offsets
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    // Build query for fetching trial conversion data
    const query = `
      SELECT 
          us.*,
          json_build_object(
              'id', u.id,
              'full_name', CONCAT(u.first_name, ' ', u.last_name),
              'email', u.email,
              'mobile_number', u.mobile_number
          ) AS users,
          json_build_object(
              'id', ft.id,
              'start_date', ft.start_date,
              'end_date', ft.end_date
          ) AS free_trials
      FROM 
          user_subscriptions us
      INNER JOIN 
          free_trials ft ON us.user_id = ft.user_id
      INNER JOIN 
          users u ON us.user_id = u.id
      WHERE 
          us.start_date >= ft.end_date
          AND us.start_date BETWEEN :startDate AND :endDate
          AND (
              us.start_date::TEXT ILIKE :searchKeyword OR 
              us.end_date::TEXT ILIKE :searchKeyword OR 
              us.actual_end_date::TEXT ILIKE :searchKeyword OR 
              CONCAT(u.first_name, ' ', u.last_name) ILIKE :searchKeyword OR 
              u.email ILIKE :searchKeyword OR
              us.subscription_id::TEXT ILIKE :searchKeyword 
          )
      ORDER BY 
          ${orderByField} ${orderDirection}
      LIMIT :limit OFFSET :offset;
    `;

    // Query to count total records
    const countQuery = `
      SELECT 
          COUNT(*) AS total_count
      FROM 
          user_subscriptions us
      INNER JOIN 
          free_trials ft ON us.user_id = ft.user_id
      INNER JOIN 
          users u ON us.user_id = u.id
      WHERE 
          us.start_date >= ft.end_date
          AND us.start_date BETWEEN :startDate AND :endDate
          AND (
              us.start_date::TEXT ILIKE :searchKeyword OR 
              us.end_date::TEXT ILIKE :searchKeyword OR 
              us.actual_end_date::TEXT ILIKE :searchKeyword OR 
              CONCAT(u.first_name, ' ', u.last_name) ILIKE :searchKeyword OR 
              u.email ILIKE :searchKeyword OR 
              u.mobile_number ILIKE :searchKeyword
          );
    `;

    // Execute the main query
    const results = await Model.sequelize.query(query, {
      replacements: {
        searchKeyword: `%${searchKeyword}%`,
        startDate: payload.whereCondition?.start_date?.between?.[0] || '1900-01-01',
        endDate: payload.whereCondition?.start_date?.between?.[1] || '2100-01-01',
        limit,
        offset,
      },
      type: Model.sequelize.QueryTypes.SELECT,
    });

    // Execute the count query
    const countResult = await Model.sequelize.query(countQuery, {
      replacements: {
        searchKeyword: `%${searchKeyword}%`,
        startDate: payload.whereCondition?.start_date?.between?.[0] || '1900-01-01',
        endDate: payload.whereCondition?.start_date?.between?.[1] || '2100-01-01',
      },
      type: Model.sequelize.QueryTypes.SELECT,
    });

    const totalRecords = countResult[0]?.total_count || 0;
    const totalPages = Math.ceil(totalRecords / pageSize);

    // Success response
    return response.success(
      res,
      'Trial conversion report fetched successfully!',
      results,
      totalRecords,
      totalPages
    );
  } catch (error) {
    console.error('Error generating trial conversion report:', error);

    // Error response
    return response.catchError(
      res,
      'Error occurred while generating trial conversion report',
      error
    );
  }
};
