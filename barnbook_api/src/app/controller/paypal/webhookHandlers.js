const { user_subscriptions, users, subscriptions, animals } = require('./../../../app/models'); // Import your models (adjust path as needed)
const moment = require('moment'); // To help with date manipulation

const handlePaymentSaleCompleted = async (webhookData) => {
    try {
        const subscriptionId = webhookData.resource.billing_agreement_id;
        
        // Fetch the user_subscription based on the subscription_id
        const data = await user_subscriptions.findOne({
            where: {
                'paypal_subscription_id': subscriptionId, // Searching within the meta_data field
            },
            include: [{
                model: subscriptions,
                as:'subscriptions',
                required: true
            }],
        });

        if (!data) {
            throw new Error('User Subscription, subscription or user not found');
        }

        // Set the start_date to today's date
        const start_date = moment().format('YYYY-MM-DD');

        // Calculate the end_date based on the billing cycle
        let end_date = moment(start_date); // Start from today's date

        switch (data.subscriptions.interval) {
            case 'Monthly':
                // Add 1 month if the interval is Monthly
                end_date = end_date.add(1, 'month');
                break;
            case 'Quarterly':
                // Add 3 months for each quarter
                end_date = end_date.add(3, 'months');
                break;
            case 'Yearly':
                // Add 1 year if the interval is Yearly
                end_date = end_date.add(1, 'year');
                break;
            case 'Weekly':
                end_date = end_date.add(1, 'week');
                break;
            case 'Daily':
                end_date = end_date.add(1, 'day');
                break;
            default:
                // Default to adding 1 month if no interval is specified
                end_date = end_date.add(1, 'month');
                break;
        }

        await user_subscriptions.update(
            { subscription_status: 'Active', end_date: end_date},
            { where: { paypal_subscription_id: subscriptionId } }
        );

        console.log('Subscription updated successfully');

        if(data.user_id){
            // update animal status 
            await animals.update(
                { trial_allowed_animals: false },
                {
                  where: {
                    user_id: data.user_id,
                    trial_allowed_animals: true
                  }
                }
              );          
        }

    } catch (error) {
        console.error('Error handling PAYMENT.SALE.COMPLETED:', error.message);
    }
};

const handleBillingSubscriptionStatus = async (webhookData) => {
    try {
        const subscriptionId = webhookData.resource.id;

        // Fetch the user_subscription based on the subscription_id
        const data = await user_subscriptions.findOne({
            where: {
                'paypal_subscription_id': subscriptionId,
            }
        });

        if (!data) {
            throw new Error('Subscription not found');
        }

        let status = 'Inactive';

        switch (webhookData.event_type) {
            case 'BILLING.SUBSCRIPTION.SUSPENDED':
                status = 'Suspended';  // Mark as suspended
                break;
            case 'BILLING.SUBSCRIPTION.CANCELLED':
                status = 'Cancelled';  // Mark as cancelled
                break;
            case 'BILLING.SUBSCRIPTION.EXPIRED':
                status = 'Inactive';  // Mark as expired
                break;
            case "BILLING.SUBSCRIPTION.ACTIVATED":
                status = 'Active'; 
                break;
            // case "BILLING.SUBSCRIPTION.CREATED":
            //     status = 'Free Trial'; 
            //     break;
            default:
                console.log('Unhandled event type:', eventType);
                return;  // If event type doesn't match, no status change
          }

          await user_subscriptions.update(
            { subscription_status: status },
            { where: { paypal_subscription_id: subscriptionId } }
        );

        console.log('Subscription cancelled successfully', data);
    } catch (error) {
        console.error('Error handling', error.message);
    }
};

module.exports = { handlePaymentSaleCompleted, handleBillingSubscriptionStatus };
