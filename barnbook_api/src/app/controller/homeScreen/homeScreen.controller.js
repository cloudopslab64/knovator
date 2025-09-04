const Model = require("../../models");
var commonfunction = require("../commanfunction/commanfunction.controller");
var response = require("../../middleware/response.middleware");
const { Op, fn, col, literal, cast } = require("sequelize");
const sequelize = require("sequelize");
const moment = require('moment'); 

// Function to fetch all records and group them based on type
exports.fetchNotifications = async function(req, res) {
  const t = await Model.sequelize.transaction(); // Start a new transaction

  try {
    const barn_manager_id = req.body.barn_manager_id;

    if (!barn_manager_id) {
      await t.commit();
      return response.fail(res, "Please provide barn manager ID!", []);
    }

    // Fetch all records from the notification_logs table within the transaction
    const notifications = await Model.notification_logs.findAll({
      where: {
        barn_manager_id: barn_manager_id
      },
      include: [
        {
          model: Model.users,
          as: 'exhibitor',
          attributes: ['photo']
        }
      ],
      order: [['createdAt', 'DESC']],
      transaction: t 
    });

    if (!notifications || notifications.length === 0) {
      await t.commit();
      return response.fail(res, 'No notifications found.', []);
    }

    let unreadNotificationCount = 0;
    notifications.map(notification => {
      if(notification.dataValues.is_read !== "Active"){
        return unreadNotificationCount++;
      }
    });

    // Group records by type and calculate duration
    const groupedNotifications = groupAndCalculateDuration(notifications);

    // Update all notifications where is_read = 'Active' and barn_manager_id matches
    await Model.notification_logs.update(
      { is_read: 'Active' }, 
      {
        where: {
          barn_manager_id: barn_manager_id, 
          is_read: 'Inactive' 
        },
        transaction: t 
      }
    );

    // Commit the transaction after all updates are successful
    await t.commit();

    // Return the grouped notifications as a successful response
    return res.json({status: 201, code: 1, message: 'Notifications fetched and updated successfully!', unreadNotificationCount: unreadNotificationCount, data: groupedNotifications});
  } catch (error) {
    // If any error occurs, rollback the transaction to ensure data consistency
    await t.rollback();
    console.error(error);
    return response.catchError(res, 'Error fetching records', error.message, 'NotificationLog');
  }
}


// Function to group the records by type (today, this week, past week) and calculate the duration
function groupAndCalculateDuration(records) {
  const now = moment(); // Get current time
  const grouped = { today: [], thisWeek: [], pastWeek: [] };

  records.forEach((record) => {
    const createdAt = moment(record.createdAt); // Moment object for createdAt timestamp

    // Determine the type: today, this week, or past week
    let type;
    if (createdAt.isSame(now, 'day')) {
      type = 'today';
    } else if (createdAt.isBetween(now.clone().subtract(7, 'days').startOf('day'), now.clone().subtract(1, 'day').endOf('day'))) {
      type = 'thisWeek';
    } else if (createdAt.isBefore(now.clone().subtract(7, 'days').startOf('day'))) {
      type = 'pastWeek';
    }

    // Add record to corresponding type group
    if (type) {
      const duration = calculateDuration(now, createdAt); // Calculate duration
      grouped[type].push({ ...record.dataValues, duration });
    }
  });

  return grouped;
}

// Function to calculate duration between now and createdAt
function calculateDuration(now, createdAt) {
  const duration = now.diff(createdAt, 'seconds'); // Get difference in seconds

  if (duration < 60) {
    return `${duration} seconds`;
  } else if (duration < 3600) {
    return `${Math.floor(duration / 60)} minutes`;
  } else if (duration < 86400) {
    return `${Math.floor(duration / 3600)} hours`;
  } else if (duration < 604800) {
    return `${Math.floor(duration / 86400)} days`;
  } else if (duration < 2419200) {
    return `${Math.floor(duration / 604800)} weeks`;
  } else if (duration < 31536000) { // Less than 1 year (365 days)
    return `${Math.floor(duration / 2419200)} months`;
  } else {
    return `${Math.floor(duration / 31536000)} years`; // 1 year = 31,536,000 seconds
  }
}

exports.landingScreen = async function(req, res) {
  try {
    const data = await Model.configurations.findOne();
    
    if (!data) {
      return response.fail(res, "No landing screen data found!", {});
    }

    const landingScreenJSON = {
      configurations: data,
      landing_screen_image: data.landing_screen_image,
      title: "Get Unlimited Exclusive Access",
      sub_title: "",//"and up to 7 days Trail FREE!",
      points: ["Add unlimited users", "Get access to all the features", "Get all the benefits", "Manage your barn anytime"]
    };

    return response.success(res, "Landing data fetched successfully!", landingScreenJSON);

  } catch (error) {
    console.error(error);
    return response.catchError(res, 'Error fetching records', error.message, 'Configurations');
  }
};

exports.deleteAccount = async function(req, res) {
  try {
    const { user_id } = req.params;
    return response.success(res, "Your account will be deleted in 90 days");
  } catch (error) {
    console.error(error);
    return response.catchError(res, 'Error fetching records', error.message);
  }
};