const express = require("express");
const paypalController = require('./../../controller/paypal/paypal.controller');
const router = express.Router();

// Define routes and link to controller functions
router.post('/create-product', paypalController.createProduct);
router.get('/fetch-products', paypalController.fetchProducts);
router.post('/create-plan', paypalController.createPlan);
router.post('/get-plan', paypalController.getPlanDetails);
router.post('/update-plan', paypalController.updatePlan);
router.post('/fetch-plans', paypalController.fetchPlans);
router.get('/create-subscription', paypalController.createSubscription);
router.get('/success', paypalController.success);
router.get('/cancel', paypalController.cancel);
router.post('/webhooks', paypalController.handleWebhook);
router.post('/createWebhook', paypalController.createWebhook);
router.post('/listWebhooks', paypalController.listWebhooks);
router.post('/updateWebhook', paypalController.updateWebhook);
router.post('/deleteWebhook', paypalController.deleteWebhook);
router.post('/checkSubscriptionStatus', paypalController.checkSubscriptionStatus);
router.post('/changeSubscriptionStatus', paypalController.changeSubscriptionStatus);
router.post('/fetchSubscriptionDetails', paypalController.fetchSubscriptionDetails);
router.get('/generateInvoicePdf/:userId/:subscriptionId', paypalController.generateInvoicePdf);
router.post('/ios-payment', paypalController.iosPayment);

module.exports = router;