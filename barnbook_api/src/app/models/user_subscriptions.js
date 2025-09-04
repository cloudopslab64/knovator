'use strict';
const { Model, DataTypes } = require('sequelize');
const axios = require('axios'); // Ensure axios is installed
const { getAccessToken, PAYPAL_API } = require('./../../app/config/paypal.config'); // Assume a utility function for getting PayPal access token

module.exports = (sequelize) => {
  class user_subscriptions extends Model {
    static associate(models) {
      // Define associations here
      this.belongsTo(models.users, {
        foreignKey: 'user_id',
        as: 'users', // Alias for the relationship
      });
      this.belongsTo(models.subscriptions, {
        foreignKey: 'subscription_id',
        as: 'subscriptions', // Alias for the relationship
      });
    }
  }

  user_subscriptions.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subscription_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    end_date: {
      type: DataTypes.DATE,
    },
    actual_end_date: {
      type: DataTypes.DATE,
    },
    subscription_status: {
      type: DataTypes.ENUM('Active','Cancelled','Suspended','Inactive','Approval Pending', 'Free Trial'),
      defaultValue: 'Inactive'
    },
    paypal_subscription_id: {
      type: DataTypes.STRING, // PayPal subscription ID
      allowNull: false, // Ensure this field is always set
      unique:true
    },  
    meta_data: {
      type: DataTypes.JSONB, // Store additional data in JSON format
      comment: "Additional data for the subscription",
      defaultValue: {}
    },
    next_billing_date: {
      type: DataTypes.DATE, // Next billing date for the subscription
      allowNull: true, // Optional field
      defaultValue: null, // Set a default value to null
      comment: "Date when the subscription will be billed again"
    },
    payment_type: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'paypal' 
    }
  }, {
    sequelize,
    modelName: 'user_subscriptions',
    tableName: 'user_subscriptions', // Specify the table name
    hooks: {
      beforeSave: async (instance, options) => {
        if (instance.paypal_subscription_id && instance.payment_type=='paypal') {
          try {
            // Fetch subscription details from PayPal
            const subscriptionDetails = await checkSubscriptionStatusFunction(instance.paypal_subscription_id);
            
            // Update the next billing date
            if (subscriptionDetails && subscriptionDetails.billing_info && subscriptionDetails.billing_info.next_billing_time) {
              instance.next_billing_date = new Date(subscriptionDetails.billing_info.next_billing_time);
              instance.meta_data = {...instance.meta_data, subscriptionDetails: subscriptionDetails}
            } else {
              console.warn(`Unable to fetch next billing time for subscription ID: ${instance.paypal_subscription_id}`);
            }
          } catch (error) {
            console.error(`Error fetching subscription details for ID: ${instance.paypal_subscription_id}`, error.message);
            throw new Error('Failed to fetch subscription details from PayPal.');
          }
        }
      }
    }
  });

  return user_subscriptions;
};

// Utility function to fetch subscription details from PayPal
const checkSubscriptionStatusFunction = async (subscriptionId) => {
  try {
    const accessToken = await getAccessToken(); // Function to get access token
    const response = await axios.get(
      `${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log("Subscription details:", response.data);
    return response.data; // Return subscription details
  } catch (error) {
    console.error("Error checking subscription status:", error.response?.data || error.message);
    throw error;
  }
};
