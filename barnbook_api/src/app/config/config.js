require('dotenv').config();

module.exports = {
  development: {
    host: process.env.DB_HOST,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dialect: process.env.DB_DIALECT,
    DB_PORT: process.env.DB_PORT,   // keep DB port
    APP_PORT: process.env.APP_PORT, // new app port
    base_url: process.env.BASE_URL
  }
};

