const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const clc = require("cli-color");
const cors = require('cors');

app.use(cors());

// Middleware to log request and response details with colors
const logger = (req, res, next) => {
    const start = Date.now();
    const apiHitTime = new Date();
  
    // Capture request details
    const { url, method, body } = req;
  
    // Prepare log string for request details but do not log it immediately
    const requestLog = `
  ${clc.blue(`------------------Start ${url}----------------------`)}
  ${clc.blue.bold("Request Details:")}
  ${clc.green("Time:")} ${apiHitTime.toLocaleString()}
  ${clc.green("URL:")} ${clc.yellow(url)}
  ${clc.green("Method:")} ${clc.yellow(method)}
  ${clc.green("Payload:")} ${JSON.stringify(body)}
  `;
  
    // Intercept and capture the response
    const originalSend = res.send;
    let responseBody;
    res.send = function (body) {
      responseBody = body;
      return originalSend.call(this, body);
    };
  
    // Wait for response to finish, then log both request and response in order
    res.on("finish", () => {
      const duration = Date.now() - start;
  
      // Response details after finish
      const responseLog = `
  ${clc.blue.bold("Response Details:")}
  ${clc.green("Body:")} ${JSON.stringify(responseBody)}
  ${clc.green("Status:")} ${clc.yellow(res.statusCode)}
  ${clc.blue.bold("API Time Required:")} ${clc.yellow(`${duration} ms`)}
  ${clc.blue(`-------------------End ${url}---------------------`)}
      `;
  
      // Log request and response at the same time in the correct order
      console.log(`${requestLog}${responseLog}`);
    });
  
    next();
  };
  
// body-parser
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000, }));
app.use(bodyParser.json());

app.use(logger);


// Set the view engine to EJS
app.set('view engine', 'ejs');

// Serve static files from the "public" folder
app.use(express.static('public'));

var appRoot = require('app-root-path');
app.use('/uploads', express.static(appRoot + '/uploads'));

// frontend routes
app.use("/", require("./views/views.route"));

// backend routes
app.use("/api", require("./app/router/index"));


const sequelize = require('../src/app/models'); // Your Sequelize setup

// Route to list tables
app.post('/list-tables', async (req, res) => {
    try {
        const tables = await sequelize.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
            { type: sequelize.QueryTypes.SELECT }
        );
        const tableNames = tables.map(table => table.table_name);
        res.render('db', { tables: tableNames });
    } catch (error) {
        res.render('db', { tables: [], error: "Error fetching tables" });
    }
});

// Route to execute raw SQL query
app.post('/execute-query', async (req, res) => {
    const { sqlQuery } = req.body;
    try {
        const queryResult = await sequelize.query(sqlQuery);
        res.render('db', { queryResult });
    } catch (error) {
        res.render('db', { queryError: error.message });
    }
});

app.use((req, res, next) => {
    res.status(400).send(`<h1> Page not found!</h1><h4> Please Check URL - <b style="color:red">'${req.url}'</b></h4>`)
})

module.exports = app;