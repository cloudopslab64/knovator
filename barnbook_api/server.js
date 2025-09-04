const http = require("http");
const app = require("./src/app");
const server = http.createServer(app);
require("dotenv").config();
var env = process.env.NODE_ENV || "development";
var config = require("./src/app/config/config")[env];
const PORT = config.APP_PORT || 4001;  // use APP_PORT instead of DB_PORT
const Model = require("./src/app/models");
const { Op } = require("sequelize");

Model.sequelize
  .authenticate()
  .then(() => {
    console.log(config);
    console.log(`"${env}" database connection established successfully!`);
  })
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {   // bind to 0.0.0.0 for external access
      console.log(`Server is running on --->  http://localhost:${PORT}/api/`);
    });
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

