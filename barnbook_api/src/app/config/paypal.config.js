// paypalConfig.js
const axios = require('axios');

const PAYPAL_API = process.env.PAYPAL_MODE === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'; 
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

const getAccessToken = async () => {
    const response = await axios({
        method: 'post',
        url: `${PAYPAL_API}/v1/oauth2/token`,
        headers: {
            'Accept': 'application/json',
            'Accept-Language': 'en_US',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
            username: CLIENT_ID,
            password: CLIENT_SECRET,
        },
        params: {
            grant_type: 'client_credentials',
        },
    });
    return response.data.access_token;
};

module.exports = { getAccessToken, PAYPAL_API };