const axios = require('axios');
const { getAccessToken, PAYPAL_API } = require('./../../config/paypal.config');
const Model = require('./../../models');
const resp = require('./../../middleware/response.middleware');
const moment = require('moment'); // To help with date manipulation
const webhookController = require('./webhookHandlers');
const { Op } = require('sequelize');
const puppeteer = require('puppeteer');

// Create a product
exports.createProduct = async (req, res) => {
    const { product_name, product_description, product_type, product_category } = req.body;

    if (!product_name || !product_description || !product_type || !product_category) {
        return resp.fail(res = res, message = 'Please provide all required fields!', data = { product_name, product_description, product_type, product_category });
    }

    try {
        const productJson = {
            name: product_name,
            description: product_description,
            type: product_type, // PHYSICAL, DIGITAL, SERVICE
            category: product_category,
            image_url: "https://example.com/streaming.jpg", // static or dynamic
            home_url: "https://example.com/home" // static or dynamic
        };

        const token = await getAccessToken();
        const response = await axios.post(`${PAYPAL_API}/v1/catalogs/products`, productJson, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        await Model.products.create({
            product_id: response.data.id,
            product_name: product_name,
            product_description: product_description,
            product_type: product_type,
            product_category: product_category,
            image_url: "https://example.com/streaming.jpg",
            home_url: "https://example.com/streaming.jpg",
        });

        return resp.success(res, 'Product created successfully!', response.data);
    } catch (error) {
        console.error('Error creating product:', error.response ? error.response.data : error.message);
        return resp.catchError(res, 'Error creating product!', error);
    }
};

// Fetch all products
exports.fetchProducts = async (req, res) => {
    try {
        const token = await getAccessToken();
        let allProducts = [];
        let nextPage = null;

        // Loop through pages to fetch all products
        do {
            const response = await axios.get(`${PAYPAL_API}/v1/catalogs/products?page_size=100`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                params: nextPage ? { cursor: nextPage } : {}  // Use cursor for pagination if available
            });

            // Append the fetched products to the allProducts array
            allProducts = [...allProducts, ...response.data.products];

            // Check if there are more products, get the cursor for the next page
            nextPage = response.data.next_cursor || null;
        } while (nextPage);  // Continue until there are no more pages

        res.json(allProducts);  // Return all fetched products
    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.status(500).send('Error fetching products');
    }
};

exports.createPlan = async (req, res) => {
    const { subscription_id, product_id } = req.body; // User provides subscription table ID

    if (!subscription_id || !product_id) {
        return resp.fail(res = res, message = 'Please provide all required fields!', data = { subscription_id, product_id });
    }

    try {
        const subscription = await Model.subscriptions.findByPk(subscription_id);

        if (!subscription) {
            return resp.fail(res, `Subscription not found for subscription id ${subscription_id}!`, subscription);
        }

        const configuration = await Model.configurations.findOne({ where: { is_active: "Active" } });

        if (!configuration) {
            return resp.fail(res, `configuration not found!`, configuration);
        }

        let interval_unit = "MONTH";  // Default to monthly
        let interval_count = 1;      // Default interval count (for monthly)

        // Set appropriate interval and charges based on subscription type
        let pricing_value = 0;
        switch (subscription.interval) {
            case 'Monthly':
                interval_unit = "MONTH";
                interval_count = 1;
                pricing_value = subscription.discounted_amount || 0; // $10 for monthly
                break;
            case 'Quarterly':
                interval_unit = "MONTH";
                interval_count = 3; // 3 months for quarterly
                pricing_value = subscription.discounted_amount || 0;
                break;
            case 'Yearly':
                interval_unit = "MONTH";
                interval_count = 12; // 12 months for yearly
                pricing_value = subscription.discounted_amount || 0;
                break;
            case 'Weekly':
                interval_unit = "DAY";
                interval_count = 7; // 7 days for weekly
                pricing_value = subscription.discounted_amount || 0; // Add appropriate discount/price
                break;
            case 'Daily':
                interval_unit = "DAY";
                interval_count = 1; // 1 day for daily
                pricing_value = subscription.discounted_amount || 0; // Add appropriate discount/price
                break;
            default:
                interval_unit = "MONTH"; // Default to monthly
                interval_count = 1;
                pricing_value = subscription.discounted_amount || 0;
                break;
        }

        // const planJson = {
        //     product_id: product_id,
        //     name: subscription.subscriptions_title,
        //     description: subscription.subscriptions_tag,
        //     billing_cycles: [
        //         {
        //             frequency: {
        //                 interval_unit: "DAY",  // e.g., "MONTH"
        //                 interval_count: configuration.free_trial_days || 7  // e.g., 1 for monthly
        //             },
        //             tenure_type: "TRIAL",  // Indicates this is a trial period
        //             sequence: 1,
        //             total_cycles: 0,  // The subscription renews indefinitely after the trial
        //             pricing_scheme: {
        //                 fixed_price: {
        //                     value: "0.00",  // Set this to zero for the trial period
        //                     currency_code: "USD"
        //                 }
        //             },
        //             trial_period: {
        //                 interval_unit: "DAY",  // Trial period in days
        //                 interval_count: 7  // 7-day free trial
        //             }
        //         },
        //         {
        //         frequency: {
        //             interval_unit: interval_unit,  // Set interval unit (monthly, quarterly, yearly)
        //             interval_count: interval_count // Set how many months (1, 3, 12)
        //         },
        //         tenure_type: "REGULAR",
        //         sequence: 2,
        //         total_cycles: 0,  // Setting total_cycles = 0 tells PayPal that the subscription should never expire automatically and should continue renewing indefinitely until the user manually cancels the subscription.
        //         pricing_scheme: {
        //             fixed_price: {
        //                 value: `${pricing_value}`, // Charge the total value upfront (10, 20, or 50)
        //                 currency_code: "USD"
        //             }
        //         },
        //         trial_period: {
        //             interval_unit: "DAY",  
        //             interval_count: 7 
        //         }
        //     }],
        //     payment_preferences: {
        //         auto_bill_outstanding: true,
        //         setup_fee: {
        //             value: "0",
        //             currency_code: "USD"
        //         },
        //         setup_fee_failure_action: "CANCEL",
        //         payment_failure_threshold: 3
        //     }
        // };

        const planJson = {
            product_id: product_id,
            name: subscription.subscriptions_title,
            description: subscription.subscriptions_tag,
            billing_cycles: [
                // {
                //     frequency: {
                //         interval_unit: "DAY",  // Define interval for trial period in days
                //         interval_count: configuration.free_trial_days || 7  // Trial length (default 7 days)
                //     },
                //     tenure_type: "TRIAL",  // Set this cycle as a trial period
                //     sequence: 1,
                //     total_cycles: 1,  // Indefinite trial, it doesn't expire
                //     pricing_scheme: {
                //         fixed_price: {
                //             value: "0.00",  // Free trial (no charge)
                //             currency_code: "USD"
                //         }
                //     }
                // },
                {
                    frequency: {
                        interval_unit: interval_unit,  // Regular cycle interval (monthly, quarterly, etc.)
                        interval_count: interval_count  // e.g., 1 for monthly
                    },
                    tenure_type: "REGULAR",  // Regular cycle after trial
                    sequence: 1,  // Sequence for regular cycle
                    total_cycles: 0,  // Indefinite, subscription renews indefinitely
                    pricing_scheme: {
                        fixed_price: {
                            value: `${pricing_value}`,  // Price for regular cycle (e.g., $10/month)
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

        // Save the created plan ID to the subscription record
        subscription.plan_id = response.data.id;
        await subscription.save();

        return resp.success(res, 'Plan created successfully!', response.data);
    } catch (error) {
        console.error('Error creating plan:', error.message);
        res.status(500).send('Error creating plan');
    }
};

exports.updatePlan = async (req, res) => {
    const { subscription_id, plan_id } = req.body; // User provides subscription table ID and PayPal plan ID

    if (!subscription_id || !plan_id) {
        return resp.fail(res, 'Please provide both subscription_id and plan_id!', { subscription_id, plan_id });
    }

    try {
        const subscription = await Model.subscriptions.findByPk(subscription_id);

        if (!subscription) {
            return resp.fail(res, `Subscription not found for subscription id ${subscription_id}!`, subscription);
        }

        const configuration = await Model.configurations.findOne({ where: { is_active: "Active" } });

        if (!configuration) {
            return resp.fail(res, 'Configuration not found!', configuration);
        }

        // Set the trial period based on configuration (if available)
        const trial_days = configuration.free_trial_days || 7; // Default to 7 days if no config found

        // Patch request data to only update the trial period
        const patchData = [
            {
                op: "replace",
                path: "/billing_cycles/0/trial_period/interval_count", // Update trial period count (days)
                value: trial_days
            }
        ];

        // Log the patch data for debugging
        console.log('Patch Data:', JSON.stringify(patchData, null, 2));

        // Get PayPal access token
        const token = await getAccessToken();

        // PATCH request to update the PayPal plan with the new trial period
        const response = await axios.patch(`${PAYPAL_API}/v1/billing/plans/${plan_id}`, patchData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        // If the update is successful
        if (response.data.id) {
            return resp.success(res, 'Plan updated successfully!', response.data);
        } else {
            return resp.fail(res, 'Error updating PayPal plan', response.data);
        }
    } catch (error) {
        console.error('Error updating plan:', error.message);
        res.status(500).send('Error updating plan');
    }
};

exports.getPlanDetails = async (req, res) => {
    const { planId } = req.body;  // Extracting the planId from URL parameters
    if (!planId)
        return res.status(400).json({ status: 'Error', message: 'Plan ID is required' });

    try {
        const response = await getPlanDetailsFunc(planId);
        return resp.success(res, "Plan details fetched successfully", response);
    } catch (error) {
        console.error('Error fetching plan details:', error.message);
        res.status(500).send('Error fetching plan details');
    }
}

const getPlanDetailsFunc = async (plan_id) => {
    const token = await getAccessToken();
    try {
        const response = await axios.get(`${PAYPAL_API}/v1/billing/plans/${plan_id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching plan details:', error.message);
    }
};


// Fetch all plans
exports.fetchPlans = async (req, res) => {
    const { planId } = req.body;  // Extracting the planId from URL parameters

    if (!planId) {
        return res.status(400).json({
            status: 'Error',
            message: 'Plan ID is required',
        });
    }

    try {
        const token = await getAccessToken();
        const response = await axios.get(`${PAYPAL_API}/v1/billing/plans/${planId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching plans:', error.message);
        res.status(500).send('Error fetching plans');
    }
};

// Create a subscription
exports.createSubscription = async (req, res) => {
    const { user_id, subscription_id } = req.query;  // Extract user_id and subscription_id from the request body

    // Validate if user_id and subscription_id are provided
    if (!user_id || !subscription_id) {
        return res.status(400).json({ message: 'user_id and subscription_id are required' });
    }

    try {
        // Find the user using the provided user_id
        const user = await Model.users.findByPk(user_id);
        if (!user) {
            return res.status(404).json({ message: `User with id ${user_id} not found` });
        }

        // Find the subscription using the provided subscription_id
        const subscription = await Model.subscriptions.findByPk(subscription_id);
        if (!subscription) {
            return res.status(404).json({ message: `Subscription with id ${subscription_id} not found` });
        }

        // Construct subscription JSON object
        const subscriptionJson = {
            plan_id: subscription.plan_id, // The plan_id from request params
            subscriber: {
                name: {
                    given_name: user.first_name || "John",
                    surname: user.last_name || "Doe"
                },
                email_address: user.email
            },
            application_context: {
                brand_name: "BarnBook",
                locale: "en-US",
                shipping_preference: "SET_PROVIDED_ADDRESS",
                user_action: "SUBSCRIBE_NOW",
                return_url: `${process.env.BASE_URL}/api/payment/success?plan_id=${subscription.plan_id}&user_id=${user.id}&subcriptions_id=${subscription.id}`,
                cancel_url: `${process.env.BASE_URL}/api/payment/cancel`
            }
        };

        // Log the constructed subscription JSON for debugging
        console.log('Subscription JSON:', JSON.stringify(subscriptionJson, null, 2));

        const token = await getAccessToken();

        const response = await axios.post(`${PAYPAL_API}/v1/billing/subscriptions`, subscriptionJson, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const approvalUrl = response.data.links.find(link => link.rel === 'approve').href;
        if (!approvalUrl) {
            return res.status(500).json({ message: 'Approval URL not found in PayPal response' });
        }

        res.redirect(approvalUrl);
    } catch (error) {
        console.error('Error creating subscription:', error.message);
        res.status(500).send('Error creating subscription');
    }
};

// Success response
exports.success = async (req, res) => {
    // Extracting parameters from the query
    const { plan_id, user_id, subcriptions_id } = req.query;

    // Validate that the necessary parameters are provided
    if (!plan_id || !user_id || !subcriptions_id) {
        return res.status(400).json({ message: 'Missing required parameters!' });
    }

    try {
        // Find the user from the user_id
        const user = await Model.users.findByPk(user_id);
        if (!user) {
            return res.status(404).json({ message: `User with id ${user_id} not found` });
        }

        // Find the subscription from the subcriptions_id
        const subscription = await Model.subscriptions.findByPk(subcriptions_id);
        if (!subscription) {
            return res.status(404).json({ message: `Subscription with id ${subcriptions_id} not found` });
        }

        // Set the start_date to today's date
        const start_date = moment().format('YYYY-MM-DD');

        // Calculate the end_date based on the billing cycle
        let end_date = moment(start_date); // Start from today's date

        switch (subscription.interval.toUpperCase()) {
            case 'MONTHLY':
                // Add 1 month if the interval is Monthly
                end_date = end_date.add(1, 'month');
                break;
            case 'QUARTERLY':
                // Add 3 months for each quarter
                end_date = end_date.add(3, 'months');
                break;
            case 'YEARLY':
                // Add 1 year if the interval is Yearly
                end_date = end_date.add(1, 'year');
                break;
            case 'WEEKLY':
                interval_unit = "DAY";
                interval_count = 7; // 7 days for weekly
                pricing_value = subscription.discounted_amount || 0; // Add appropriate discount/price
                break;
            case 'DAILY':
                interval_unit = "DAY";
                interval_count = 1; // 1 day for daily
                pricing_value = subscription.discounted_amount || 0; // Add appropriate discount/price
                break;
            default:
                // Default to adding 1 month if no interval is specified
                end_date = end_date.add(1, 'month');
                break;
        }

        // Create the user_subscription record
        const userSubscription = await Model.user_subscriptions.create({
            user_id: user_id,
            subscription_id: subcriptions_id,
            start_date: start_date,
            next_billing_date: end_date.format('YYYY-MM-DD'), // Format the end date
            end_date: end_date.format('YYYY-MM-DD'), // Format the end date
            actual_end_date: end_date.format('YYYY-MM-DD'),
            subscription_status: 'Active',
            paypal_subscription_id: req.query.subscription_id,
            meta_data: { ...req.query, date: start_date, ...subscription.dataValues }
        });

        // Respond with success message
        res.status(200).json({
            message: 'Subscription successfully created!',
            success: true,
            userSubscription,
        });

        // Cancel the previous subscription of that user
        const previousSubscription = await Model.user_subscriptions.findAll({
            where: {
                user_id: user_id,
                subscription_status: 'Active',
                id: {
                    [Model.Sequelize.Op.ne]: userSubscription.id
                }
            }
        });

        for (let i = 0; i < previousSubscription.length; i++) {
            const element = previousSubscription[i];
            await cancelSubscription(element.paypal_subscription_id);
        }

    } catch (error) {
        console.error('Error in subscription success:', error.message);
        return res.status(500).json({ success: false, message: 'Error in subscription success' });
    }
};


// Success response
exports.iosPayment = async (req, res) => {
    // Extracting parameters from the query
    const { plan_id, user_id, subscription_id } = req.body;

    // Validate that the necessary parameters are provided
    if (!plan_id || !user_id || !subscription_id) {
        return res.status(400).json({ message: 'Missing required parameters!' });
    }

    try {
        // Find the user from the user_id
        const user = await Model.users.findByPk(user_id);
        if (!user) {
            return res.status(404).json({ message: `User with id ${user_id} not found` });
        }
        console.log("req.body", req.body);

        // Find the subscription from the subcriptions_id
        const subscription = await Model.subscriptions.findByPk(subscription_id);
        console.log("subscription", subscription);

        if (!subscription) {
            subscription
            return res.status(404).json({ message: `Subscription with id ${subscription_id} not found` });
        }

        // Set the start_date to today's date
        const start_date = moment().format('YYYY-MM-DD');

        // Calculate the end_date based on the billing cycle
        let end_date = moment(start_date); // Start from today's date
        end_date = end_date.add(1, 'month');

        console.log("req.body.subscription_id", subscription_id)

        const timestamp = Date.now();
        let paypal_subscription_id = plan_id + "-" + timestamp;
        const userSubscription = await Model.user_subscriptions.create({
            user_id: user_id,
            subscription_id: subscription_id,
            start_date: start_date,
            end_date: end_date.format('YYYY-MM-DD'), // Format the end date
            actual_end_date: end_date.format('YYYY-MM-DD'),
            subscription_status: 'Active',
            paypal_subscription_id: paypal_subscription_id,
            payment_type: 'ios',
            meta_data: { ...req.body, date: start_date, ...subscription.dataValues }
        });

        // Respond with success message
        res.status(200).json({
            message: 'Subscription successfully created!',
            success: true,
            userSubscription,
        });
    } catch (error) {
        console.error('Error in subscription success:', error.errors);
        return res.status(500).json({ success: false, message: 'Error in subscription success' });
    }
};

const cancelSubscription = async (subscriptionId) => {
    try {
        const token = await getAccessToken(); // Ensure this function retrieves a valid access token

        // Cancel the existing subscription
        await axios.post(`${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}/cancel`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        console.log(`Subscription ${subscriptionId} cancelled successfully.`);
    } catch (error) {
        console.error(`Error cancelling subscription ${subscriptionId}:`, error.response?.data || error.message);
    }
};

exports.cancel = async (req, res) => {
    // Respond with success message...
    return res.status(200).json({
        message: 'Subscription canceled!',
        success: false
    });
};

// Webhook handler to route different events
exports.handleWebhook = async (req, res) => {
    try {
        const webhookEvent = req.body; // Assuming body contains the PayPal webhook event data

        switch (webhookEvent.event_type) {
            case 'PAYMENT.SALE.COMPLETED':
                // Trigger: When a payment (initial or renewal) is successfully completed.
                await webhookController.handlePaymentSaleCompleted(webhookEvent);
                break;

            case 'BILLING.SUBSCRIPTION.SUSPENDED':
            case 'BILLING.SUBSCRIPTION.CANCELLED':
            case 'BILLING.SUBSCRIPTION.EXPIRED':
            case 'BILLING.SUBSCRIPTION.ACTIVATED':
                // case 'BILLING.SUBSCRIPTION.CREATED':
                await webhookController.handleBillingSubscriptionStatus(webhookEvent);
                break;

            default:
                console.log('Unhandled webhook event:', webhookEvent.event_type);
                break;
        }

        res.status(200).send('Webhook handled successfully');
    } catch (error) {
        console.error('Error handling webhook:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

exports.createWebhook = async (req, res) => {
    // Extract data from the request body
    const { webhookUrl, eventTypes } = req.body;

    // Check if required fields are provided
    if (!webhookUrl || !eventTypes || !Array.isArray(eventTypes) || eventTypes.length === 0) {
        return res.status(400).json({
            status: "Error",
            message: "Webhook URL and event types are required"
        });
    }

    // Prepare the webhook payload
    const webhookPayload = {
        url: webhookUrl,
        event_types: eventTypes.map(event => ({ name: event })),
    };

    try {
        // Get access token
        const token = await getAccessToken(); // Ensure this function retrieves a valid access token

        // Make the request to create the webhook
        const response = await axios.post(`${PAYPAL_API}/v1/notifications/webhooks`, webhookPayload, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        // Respond with success message
        console.log("Webhook created successfully:", response.data);
        return res.status(201).json({
            status: "Success",
            message: "Webhook created successfully",
            data: response.data
        });
    } catch (error) {
        console.error("Error creating webhook:", error.response?.data?.details || error.message);
        return res.status(500).json({
            status: "Error",
            message: "Failed to create webhook",
            error: error.response?.data?.details || error.message
        });
    }
};

exports.listWebhooks = async (req, res) => {
    try {
        // Get access token
        const token = await getAccessToken();

        // Make the request to list webhooks
        const response = await axios.get(`${PAYPAL_API}/v1/notifications/webhooks`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        // Respond with the list of webhooks
        console.log("Webhooks retrieved successfully:", response.data);
        return res.status(200).json({
            status: "Success",
            message: "Webhooks retrieved successfully",
            data: response.data
        });
    } catch (error) {
        console.error("Error retrieving webhooks:", error.response?.data?.details || error.message);
        return res.status(500).json({
            status: "Error",
            message: "Failed to retrieve webhooks",
            error: error.response?.data?.details || error.message
        });
    }
};

exports.updateWebhook = async (req, res) => {
    const { webhookId, webhookUrl, eventTypes } = req.body;

    // Check if required fields are provided
    if (!webhookId || !webhookUrl || !eventTypes || !Array.isArray(eventTypes) || eventTypes.length === 0) {
        return res.status(400).json({
            status: "Error",
            message: "Webhook ID, URL, and event types are required"
        });
    }

    // Prepare the webhook payload
    const webhookPayload = {
        url: webhookUrl,
        event_types: eventTypes.map(event => ({ name: event })),
    };

    try {
        // Get access token
        const token = await getAccessToken();

        console.log(`${PAYPAL_API}/v1/notifications/webhooks/${webhookId}`);

        // Make the request to update the webhook
        const response = await axios.patch(`${PAYPAL_API}/v1/notifications/webhooks/${webhookId}`, webhookPayload, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        // Respond with success message
        console.log("Webhook updated successfully:", response.data);
        return res.status(200).json({
            status: "Success",
            message: "Webhook updated successfully",
            data: response.data
        });
    } catch (error) {
        console.error("Error updating webhook:", error.response?.data?.details || error.message);
        return res.status(500).json({
            status: "Error",
            message: "Failed to update webhook",
            error: error.response?.data?.details || error.message
        });
    }
};

exports.deleteWebhook = async (req, res) => {
    const { webhookId } = req.body;

    // Ensure the webhook ID is provided
    if (!webhookId) {
        return res.status(400).json({
            status: "Error",
            message: "Webhook ID is required"
        });
    }

    try {
        // Retrieve access token
        const token = await getAccessToken();

        // Construct the URL for deleting the webhook
        const webhookUrlToDelete = `https://api.sandbox.paypal.com/v1/notifications/webhooks/${webhookId}`;

        // Send DELETE request to PayPal to delete the webhook
        const response = await axios.delete(webhookUrlToDelete, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        // If successful, send response
        console.log("Webhook deleted successfully:", response.data);
        return res.status(200).json({
            status: "Success",
            message: "Webhook deleted successfully",
            data: response.data
        });
    } catch (error) {
        // Handle error
        console.error("Error deleting webhook:", error.response?.data?.details || error.message);
        return res.status(500).json({
            status: "Error",
            message: "Failed to delete webhook",
            error: error.response?.data?.details || error.message
        });
    }
};

// Controller to check subscription status
exports.checkSubscriptionStatus = async (req, res) => {
    // Extract subscriptionId from the request parameters (or body, depending on your design)
    const { subscriptionId } = req.body;

    // Validate that subscriptionId is provided
    if (!subscriptionId) {
        return res.status(400).json({
            status: "Error",
            message: "Subscription ID is required",
        });
    }

    try {
        // Call the helper function to get the subscription status
        const subscriptionStatusData = await checkSubscriptionStatusFunction(subscriptionId);

        // Return the subscription status to the client
        return res.status(200).json({
            status: "Success",
            message: "Subscription status retrieved successfully",
            data: subscriptionStatusData,
        });
    } catch (error) {
        console.error("Error checking subscription status:", error.response?.data || error.message);
        return res.status(500).json({
            status: "Error",
            message: "Failed to retrieve subscription status",
            error: error.response?.data || error.message,
        });
    }
};

// Helper function to check subscription status
const checkSubscriptionStatusFunction = async (subscriptionId) => {
    try {
        const accessToken = await getAccessToken();
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
        return response.data; // Return the current subscription status
    } catch (error) {
        console.error("Error checking subscription status:", error.response?.data || error.message);
        throw error; // Propagate the error to be handled by the controller
    }
};

// Controller to change subscription status
exports.changeSubscriptionStatus = async (req, res) => {
    const { subscriptionId, action } = req.body;  // Extract subscriptionId and action from the URL params

    // Validate that subscriptionId and action are provided
    if (!subscriptionId || !action) {
        return res.status(400).json({
            status: "Error",
            message: "Subscription ID and action are required",
        });
    }

    // Validate that action is one of the allowed values
    if (!['cancel', 'suspend', 'activate'].includes(action)) {
        return res.status(400).json({
            status: "Error",
            message: "Invalid action. Allowed actions are 'cancel', 'suspend', 'activate'.",
        });
    }

    try {
        // Call the helper function to change the subscription status
        const subscriptionResponse = await changeSubscriptionStatusFunction(subscriptionId, action);

        // Return the response from PayPal
        return res.status(200).json({
            status: "Success",
            code: 1,
            message: `Subscription ${action} successfully`,
            data: subscriptionResponse,
        });
    } catch (error) {
        console.error(`Error changing subscription status to ${action}:`, error.response?.data || error.message);
        return res.status(500).json({
            status: "Error",
            code: 0,
            message: `Failed to change subscription status to ${action}`,
            error: error.response?.data || error.message,
        });
    }
};

// Helper function to change subscription status
const changeSubscriptionStatusFunction = async (subscriptionId, action) => {
    try {
        const accessToken = await getAccessToken();

        let url, data, newStatus;
        if (action === 'cancel') {
            // For canceling a subscription
            url = `${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}/cancel`;
            data = {
                reason: "User requested cancellation" // Customize the reason
            };
            newStatus = 'Cancelled';
        } else if (action === 'suspend') {
            // Suspending a subscription
            url = `${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}/suspend`;
            data = {};  // Add any specific data if necessary
            newStatus = 'Suspended';
        } else if (action === 'activate') {
            // Reactivate a suspended subscription
            url = `${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}/activate`;
            data = {};
            newStatus = 'Active';
        } else {
            throw new Error("Invalid action. Allowed actions are 'cancel', 'suspend', 'activate'.");
        }

        // Make the API call to change the subscription status
        const response = await axios.post(url, data, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        console.log(`Subscription ${action}d successfully:`, response.data);

        // Update subscription status in the database
        await Model.user_subscriptions.update(
            { subscription_status: newStatus }, // Update the status
            { where: { paypal_subscription_id: subscriptionId } }   // Find the subscription by ID
        );

        console.log(`Subscription status updated to ${newStatus} in the database.`);

        return response.data;
    } catch (error) {
        console.error(`Error changing subscription status to ${action}:`, error.response?.data || error.message);
        throw error; // Propagate the error to be handled by the controller
    }
};

// Fetch Subscription Details for a user
exports.fetchSubscriptionDetails = async (req, res) => {
    try {
        const { userId } = req.body; // Extract userId from the request body
        if (!userId) {
            return resp.fail(res, "User ID is required");
        }

        // Call the getSubscriptionDetails function
        const subscriptionDetails = await getSubscriptionDetails(userId);
        return resp.success(res, "Data fetched successfully!", subscriptionDetails);

    } catch (error) {
        console.error("Error in fetchSubscriptionDetails:", error);

        // Handle errors gracefully and provide more context
        return resp.catchError(res, "Something went wrong while fetching subscription details.", {
            subscription_status: "Inactive",
            message: error.message || "An internal server error occurred.",
            error: error.stack || "No stack trace available.",
        });
    }
};

const getSubscriptionDetails = async (userId) => {
    try {
        // Fetch the most recent active subscription for the user
        const mostRecentSubscription = await Model.user_subscriptions.findOne({
            where: {
                user_id: userId,
                //   subscription_status: 'Active',
                subscription_status: {
                    [Op.in]: ['Active', 'Cancelled'],
                },
                actual_end_date: {
                    [Op.gte]: new Date(), // Today's date should be equal or less than `end_date`
                },
            },
            order: [['createdAt', 'DESC']],
        });

        if (!mostRecentSubscription) {
            // No active subscription found, check free trials
            let freeTrial = await Model.free_trials.findOne({
                where: {
                    user_id: userId,
                    end_date: {
                        [Op.gte]: new Date(), // Today's date should be equal or less than `end_date`
                    },
                },
                order: [['createdAt', 'DESC']],
            });

            if (freeTrial) {

                const configurations = await Model.configurations.findOne();

                // Initialize meta_data if it does not exist
                freeTrial.dataValues.meta_data = freeTrial.dataValues.meta_data || {};

                freeTrial.dataValues.meta_data.features = configurations.free_trial_features;

                freeTrial.dataValues.meta_data.free_trial_days = getDifferenceInDays(freeTrial.start_date, freeTrial.end_date);

                // Free trial exists
                return {
                    subscription_status: "Active",
                    subscription_type: "Free Trial",
                    is_cancelled: false,
                    plan_details: freeTrial,
                    next_billing_date: freeTrial.end_date,
                    subscription_history: [],
                };
            }

            const previousPlanType = await Model.user_subscriptions.findOne({ where: { user_id: userId } });

            if (previousPlanType) {
                return {
                    subscription_status: "Inactive",
                    is_cancelled: true, // here in subscription_status 'Inactive', true means paid plan has expired -----------
                    subscription_type: "Free Trial",
                    message: "No active subscription found for this user.",
                    popupMessage: {
                        title: "Subscription Expired",
                        subtitle: "Your access has been restricted.",
                        description: "Your subscription plan has expired. Please renew your plan to continue enjoying uninterrupted services.",
                        buttonTitle: "Subscribe"
                    }
                };
            }

            const configuration = await Model.configurations.findOne({ where: { is_active: "Active" } });

            // No free trial found, assume "Paid" subscription type
            return {
                subscription_status: "Inactive",
                is_cancelled: false, // here in subscription_status 'Inactive', false means free trial plan has expired ----------
                subscription_type: "Free Trial",
                message: "No active subscription or free trial found for this user.",
                popupMessage: {
                    title: "Your free trial has expired",
                    subtitle: `Your ${configuration.free_trial_days}-days free trial has expired now.`,
                    description: "You have no longer access to the features. Upgrade your plan now.",
                    buttonTitle: "Subscribe"
                }
            };
        }

        // Active subscription exists, proceed with fetching history
        const nextBillingDate = mostRecentSubscription.next_billing_date;

        // Fetch subscription history (excluding the most recent one)
        const subscriptionHistory = await Model.user_subscriptions.findAll({
            where: {
                user_id: userId,
                id: { [Op.ne]: mostRecentSubscription.id }, // Exclude most recent subscription
            },
            order: [['createdAt', 'DESC']],
        });

        let payment_method = "PayPal";
        if (mostRecentSubscription.dataValues?.payment_type == "ios") {
            payment_method = "ApplePay";
        }

        // Return the details of the active subscription and history
        return {
            subscription_status: "Active",
            subscription_type: "Paid",
            is_cancelled: mostRecentSubscription.subscription_status == "Cancelled", // Set true if status is "Cancelled"
            plan_details: { ...mostRecentSubscription.dataValues, payment_method: payment_method, order_id: mostRecentSubscription.id },
            next_billing_date: nextBillingDate,
            subscription_history: subscriptionHistory,
        };
    } catch (error) {
        console.error("Error in getSubscriptionDetails:", error.message);
        throw new Error("Unable to fetch subscription details. Please try again later.");
    }
};

const getDifferenceInDays = (start_date, end_date) => {
    // Convert the dates to UTC to ignore time differences
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    // Set time to midnight for both dates
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    // Calculate the difference in milliseconds
    const differenceInMs = endDate - startDate;

    // Convert milliseconds to days
    return differenceInMs / (1000 * 60 * 60 * 24);
};


const getSubscriptionDetailss = async (subscriptionId) => {
    try {
        const token = await getAccessToken(); // Ensure this function retrieves a valid access token

        // Fetch subscription details
        const subscriptionResponse = await axios.get(`${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        const subscriptionDetails = subscriptionResponse.data;
        console.log("Subscription Details:", subscriptionDetails);

        // Check if payment method details are included
        const paymentMethod = subscriptionDetails.billing_info?.last_payment?.method;
        console.log("Payment Method:", paymentMethod);

        // Fetch transactions for the subscription
        const transactionsResponse = await axios.get(`${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}/transactions`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            params: {
                start_time: "2023-01-01T00:00:00Z", // Adjust the start time as needed
                end_time: "2024-11-28T23:59:59Z",   // Adjust the end time as needed
            },
        });

        const transactions = transactionsResponse.data.transactions;
        console.log(JSON.stringify(transactions, null, 2));
        console.log("Transactions:", transactions);

        return {
            subscriptionDetails,
            transactions,
        };
    } catch (error) {
        console.error("Error fetching subscription details or transactions:", error.response?.data || error.message);
        throw new Error("Failed to fetch subscription details or transactions");
    }
};

// Example usage
const subscriptionId = "I-KK6M46MBE6JH"; // Replace with your actual subscription ID
// getSubscriptionDetailss(subscriptionId).catch(err => console.error(err));

const pdf = require('html-pdf');  // Import html-pdf

exports.generateInvoicePdf = async (req, res) => {
    const { subscriptionId, userId } = req.params;

    if (!subscriptionId || !userId) {
        return res.status(400).json({ code: 0, message: 'Subscription ID and User ID are required' });
    }

    try {
        const token = await getAccessToken(); // Get access token

        // Fetch subscription data from the database
        const subscriptionData = await Model['user_subscriptions'].findOne({
            where: {
                paypal_subscription_id: subscriptionId
            }
        });

        if (!subscriptionData || subscriptionData.length === 0) {
            return res.status(404).json({ code: 0, message: 'Subscription not found' });
        }

        // Fetch subscription details from PayPal API
        const subscriptionResponse = await axios.get(`${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        const subscriptionDetails = subscriptionResponse.data;
        if (!subscriptionDetails) {
            return res.status(404).json({ code: 0, message: 'Subscription details not found' });
        }

        console.log(JSON.stringify(subscriptionData, null, 2));
        console.log(JSON.stringify(subscriptionDetails, null, 2));

        // HTML template for the invoice
        const invoiceHtml = `
            <html>
                <head>
                    <style>
                        body {
                            font-family: 'Arial', sans-serif;
                            margin: 0;
                            padding: 0;
                            background-color: #f4f4f4;
                            color: #333;
                        }
                        .container {
                            width: 80%;
                            margin: 0 auto;
                            padding: 20px;
                            background: #fff;
                            border-radius: 8px;
                            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                        }
                        h1 {
                            text-align: center;
                            font-size: 24px;
                            color: #444;
                        }
                        .invoice-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 20px;
                        }
                        .invoice-header div {
                            flex: 1;
                        }
                        .company-name {
                            font-weight: bold;
                            font-size: 28px;
                            color: #2c3e50;
                        }
                        .invoice-info {
                            text-align: right;
                        }
                        .details {
                            margin-top: 20px;
                            padding: 15px;
                            background-color: #ecf0f1;
                            border-radius: 8px;
                            margin-bottom: 20px;
                        }
                        .details p {
                            font-size: 14px;
                            line-height: 1.8;
                            margin: 8px 0;
                        }
                        .details .label {
                            font-weight: bold;
                            color: #34495e;
                        }
                        .table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 20px;
                        }
                        .table th, .table td {
                            padding: 8px;
                            text-align: left;
                            border-bottom: 1px solid #ddd;
                        }
                        .table th {
                            background-color: #2c3e50;
                            color: #fff;
                        }
                        .total-row {
                            font-weight: bold;
                            font-size: 16px;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 30px;
                            font-size: 12px;
                            color: #7f8c8d;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <!-- Invoice Header -->
                        <div class="invoice-header">
                            <div class="company-name">BarnBook</div>
                            <div class="invoice-info">
                                <p><strong>Invoice Date:</strong> ${new Date().toLocaleDateString()}</p>
                                <p><strong>Invoice #:</strong> ${subscriptionId}</p>
                            </div>
                        </div>

                        <!-- Subscription Details -->
                        <div class="details">
                            <h2>Subscription Details</h2>
                            <p><span class="label">Subscription ID:</span> ${subscriptionDetails.id}</p>
                            <p><span class="label">Status:</span> ${subscriptionDetails.status}</p>
                            <p><span class="label">Start Date:</span> ${subscriptionDetails.start_time}</p>
                            <p><span class="label">Plan Name:</span> ${subscriptionDetails.plan_id}</p>
                            <p><span class="label">Interval:</span> ${subscriptionData.meta_data.interval}</p>
                            <p><span class="label">Next Billing Date:</span> ${subscriptionData.next_billing_date}</p>
                            <p><span class="label">Discounted Amount:</span> $${subscriptionData.meta_data.discounted_amount}</p>
                        </div>

                        <!-- Subscriber Details -->
                        <div class="details">
                            <h2>Subscriber Details</h2>
                            <p><span class="label">Subscriber Name:</span> ${subscriptionDetails.subscriber.name.given_name} ${subscriptionDetails.subscriber.name.surname}</p>
                            <p><span class="label">Subscriber Email:</span> ${subscriptionDetails.subscriber.email_address}</p>
                        </div>

                        <!-- Transaction Details -->
                        <div class="details">
                            <h2>Last Transaction Details</h2>
                            <p><span class="label">Amount:</span> ${subscriptionDetails.billing_info.last_payment.amount.value} ${subscriptionDetails.billing_info.last_payment.amount.currency_code}</p>
                            <p><span class="label">Payment Date:</span> ${subscriptionDetails.billing_info.last_payment.time}</p>
                        </div>

                        <div class="footer">
                            <p>Thank you for your business!</p>
                            <p>For any inquiries, contact us at support@barnbook.com</p>
                        </div>
                    </div>
                </body>
            </html>
        `;

        console.log("Generated HTML: ", invoiceHtml);  // Debugging HTML content

        // Generate the PDF from HTML using html-pdf
        pdf.create(invoiceHtml, { format: 'A4' }).toBuffer((err, buffer) => {
            if (err) {
                console.error("Error generating PDF: ", err);
                return res.status(500).send('Error generating PDF invoice');
            }

            // Set headers for the PDF download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=invoice-${subscriptionId}.pdf`);

            // Send the generated PDF buffer as response
            res.send(buffer);
        });
    } catch (error) {
        console.error('Error generating PDF invoice:', error);
        res.status(500).send('Error generating PDF invoice');
    }
};

