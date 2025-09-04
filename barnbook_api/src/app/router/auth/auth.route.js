const express = require("express");
const auth = require("../../controller/auth/auth.controller");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: 200,
    message: "This is auth page!",
  });
});

// User Exhibitor Routes

router.post("/mobileVerificationRequest", auth.mobileVerificationRequest); // verify mobile no. while sign up
router.post("/registerUser", auth.verifyAndRegisterUser); // User Registratoin
router.post("/updateUser", auth.verifyAndRegisterUser); // User profile updation
router.post("/createExhibitor", auth.verifyAndRegisterUser); // Exhibitor Registration
router.post("/updateExhibitor", auth.verifyAndRegisterUser); // Update Exhibitor
router.post("/subscribePlan", auth.subscribePlan); // Subscription
router.post("/loginOtpRequest", auth.login); // Login (User/Exhibitor)
router.post("/verifyLoginOtp", auth.verifyOtp); // Verify Login
router.post("/refreshToken", auth.refreshToken); // Refresh Token
router.post("/registerFreeTrial", auth.registerFreeTrial);

router.post("/deactivateUser", auth.deactivateUser);

// Admin Routes
router.post("/adminSignup", auth.adminSignup); 
router.post("/adminLogin", auth.adminLogin); 
router.post("/adminForgotPassword", auth.adminForgotPassword); 
router.post("/adminResetPassword", auth.adminResetPassword); 



module.exports = router;
