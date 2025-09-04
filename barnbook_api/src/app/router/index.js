const express = require("express");
const router = express.Router();
const {authenticateToken, authorizeRoles,authorizeRolesAndPlan} = require('../middleware/auth.middleware.js');

router.get("/", (req, res) => {
  res.json({
    status: 200,
    message: "This is api page!",
  });
});

router.use("/payment", require("./paypal/paypal.route.js"));

router.use("/auth", require("./auth/auth.route.js"));

router.use("/masters",  /*authenticateToken, /*authorizeRolesAndPlan('admin', 'user'),*/ require("./masters/masters.route"));



module.exports = router;
