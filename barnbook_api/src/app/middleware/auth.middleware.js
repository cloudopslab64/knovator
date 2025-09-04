const jwt = require("jsonwebtoken");
const resp = require("../middleware/response.middleware");
const response = require("../middleware/response.middleware");
const Model = require("../models");
const { Op } = require("sequelize");

// Middleware to authenticate the JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return resp.fail(res, "Token not found!", "");
  }

  jwt.verify(token, process.env.JWT_SECRET || "secret", (err, user) => {
    if (err) {
      return res.status(403).json({
        status: 403,
        code: 1,
        message: "Your session has expired. Please log in again.",
        isTokenExpired: true,
        data: {}
      });
    }

    // Assign user to the request object for later use
    req.user = user;

    // Call next middleware
    next();
  });
};

// Middleware to authorize user based on roles
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return resp.fail(
        res,
        "You do not have the necessary permissions to perform this action!",
        ""
      );
    }
    next();
  };
};

const authorizeRolesAndPlan = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const user = req.user; // Assuming user info is attached to req object after authentication
      if (!user) return response.fail(res, "Unauthorized access", "");

      // Check if the user's role is allowed
      if (!allowedRoles.includes(user.role)) {
        return response.fail(
          res,
          "You do not have the necessary permissions to perform this action!",
          ""
        );
      }

      // // Check if the user has an active subscription
      // const activeSubscription = await Model['user_subscriptions'].findOne({
      //   where: {
      //     user_id: user.id,
      //     is_active: true,
      //     end_date: {
      //       [Op.gt]: new Date(), // Check if subscription's end date is greater than the current date
      //     },
      //   },
      //   // include: [{
      //   //   model: Model['subscription_plans'],
      //   //   as: 'subscription_plans',
      //   //   attributes: ['plan_id', 'plan_name', 'duration_days', 'price'],
      //   // }],
      // });

      // // If no active subscription is found, fail the authorization
      // if (!activeSubscription) {
      //   return response.fail(res, "Your subscription has expired or is invalid. Please renew to continue.", "");
      // }

      // Proceed if the user has valid roles and an active subscription
      next();
    } catch (error) {
      console.error("Authorization error: ", error.message);
      return response.fail(
        res,
        "Something went wrong with authorization!",
        error.message
      );
    }
  };
};

module.exports = { authenticateToken, authorizeRoles, authorizeRolesAndPlan };
