'use strict';
const { Model, DataTypes } = require('sequelize');
const axios = require('axios');

module.exports = (sequelize) => {
  class subscriptions extends Model {
    static associate(models) {
      // Define associations here
      this.hasMany(models.user_subscriptions, {
        foreignKey: 'subscription_id',
        as: 'user_subscriptions', // Alias for the relationship
      });
      this.hasMany(models.invoices, {
        foreignKey: 'subscription_id',
        as: 'invoices', // Alias for the relationship
      });
      // this.belongsTo(models.products, {
      //   foreignKey: 'product_id',
      //   as: 'products',
      // });
      
    }
  }

  subscriptions.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    plan_id: {
      type: DataTypes.STRING,
    },
    subscriptions_title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subscriptions_tag: {
      type: DataTypes.STRING,
    },
    subscriptions_amount: {
      type: DataTypes.FLOAT,
    },
    discount_in_percentage: {
      type: DataTypes.STRING,
    },
    discounted_amount: {
      type: DataTypes.FLOAT,
    },
    plan_offers: {
      type: DataTypes.JSON, // Use JSON data type to store an array of offers
    },
    interval: {
      type: DataTypes.ENUM('Yearly', 'Quarterly', 'Monthly', 'Weekly', 'Daily'), // Use ENUM for fixed interval types
    },
    additional_days_offered: {
      type: DataTypes.STRING,
    },
    features: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    is_active: {
      type: DataTypes.ENUM('Active', 'Inactive'),
    },
  }, {
    sequelize,
    modelName: 'subscriptions',
    tableName: 'subscriptions', // Specify the table name
  });

  // Add the afterSave hook
  subscriptions.addHook('afterSave', async (subscription, options) => {
    try {
      // Ensure that options.context and options.context.modelName exist before comparing
      if (options && options.context && options.context.modelName === 'subscriptions') {
        // Call createPlan function after a subscription is created/updated
        await createPlan(subscription.id);
      }
    } catch (error) {
      console.error('Error during afterSave hook:', error.message);
    }
  });
  
  return subscriptions;
};


const createPlan = async (subscription_id) => {

  const Model = require("./../models");
  const { getAccessToken, PAYPAL_API } = require("./../config/paypal.config");

  if (!subscription_id) {
    return resp.fail(res, 'Please provide the subscription ID!', { subscription_id });
  }

  try {
    const subscription = await Model.subscriptions.findByPk(subscription_id);

    if (!subscription) {
      return console.error(`Subscription not found for subscription id ${subscription_id}!`);
    }

    // Fetch product_id from configurations table
    const configuration = await Model.configurations.findOne({ where: { is_active: "Active" } });

    if (!configuration) {
      return console.error(`Configuration not found!`);
    }

    const product_id = configuration.paypal_product_id;

    let interval_unit = "MONTH";  // Default to monthly
    let interval_count = 1;      // Default interval count (for monthly)
    let pricing_value = subscription.discounted_amount || 0;

    switch (subscription.interval) {
      case 'Monthly':
        interval_unit = "MONTH";
        interval_count = 1;
        break;
      case 'Quarterly':
        interval_unit = "MONTH";
        interval_count = 3;
        break;
      case 'Yearly':
        interval_unit = "MONTH";
        interval_count = 12;
        break;
      case 'Weekly':
        interval_unit = "DAY";
        interval_count = 7;
        break;
      case 'Daily':
        interval_unit = "DAY";
        interval_count = 1;
        break;
    }

    const planJson = {
      product_id: product_id,
      name: subscription.subscriptions_title,
      description: subscription.subscriptions_tag,
      billing_cycles: [
        {
          frequency: {
            interval_unit: interval_unit,
            interval_count: interval_count
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: `${pricing_value}`,
              currency_code: "USD"
            }
          }
        }
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: "0",
          currency_code: "USD"
        },
        setup_fee_failure_action: "CANCEL",
        payment_failure_threshold: 3
      }
    };

    console.log(JSON.stringify(planJson, null, 2));

    // Get access token from PayPal
    const token = await getAccessToken();
    const response = await axios.post(`${PAYPAL_API}/v1/billing/plans`, planJson, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    await subscription.update({ plan_id: response.data.id }, { where: { id: subscription_id } });

    return resp.success(res, 'Plan created successfully!', response.data);
  } catch (error) {
    console.error('Error creating plan:', error.message);
    res.status(500).send('Error creating plan');
  }
};
