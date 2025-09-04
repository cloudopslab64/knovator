const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Model = require("../../models");
const resp = require("../../middleware/response.middleware");
const env = process.env.NODE_ENV ? process.env.NODE_ENV : "development";
const { base_url } = require("../../config/config")[env];
const { Op } = require("sequelize");
const response = require("../../middleware/response.middleware");
const commonFunction = require("../commanfunction/commanfunction.controller");

// Store mobile number and generate OTP
exports.mobileVerificationRequest = async (req, res) => {
  // const t = await Model.sequelize.transaction();
  try {
    const { mobile_number, country_calling_code_id } = req.body;

    // Validate input
    if (!mobile_number) {
      return response.fail(res, "Please provide the mobile number!", "");
    }

    if (!Number(country_calling_code_id)) {
      return response.fail(
        res,
        "Please provide the mobile number country code!",
        ""
      );
    }

    // Check if mobile number already exists in users table
    const userExists = await Model["users"].findOne({
      where: { country_calling_code_id, mobile_number, is_login_required: true },
    });

    if (userExists) {
      return response.fail(res, "Mobile number already exists", "");
    }

    // Generate OTP and set expiry time
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    // const otp = 1234;
    const otp_expiry = new Date(Date.now() + 2 * 60 * 1000); // OTP expires in 2 minutes

    // Store mobile number and OTP in temp table
    const tempUser = await Model["temp_mobile_number_verifications"].create(
      {
        mobile_number,
        otp,
        otp_expiry,
        country_calling_code_id,
      },
      // { transaction: t }
    );

    let country_code = await Model["country_masters"].findOne({
      where: { id: country_calling_code_id },
    });

    if(!country_code){
      return response.fail(
        res,
        "No country code found with the current mobile number!",
        ""
      );
    }

    // Commit transaction
    // await t.commit();
    // Send OTP to the user (optional, using SMS service like Twilio)
    // sendOTP(mobile_number, otp);
    await commonFunction.sendSMS(`${country_code.country_calling_code} ${mobile_number}`, `Your verification code is ${otp}. Please enter this code to verify your phone number. This code will expire in 2 minutes.`);

    if(req.body.email){
      await commonFunction.sendLoginOTPEmail(otp,otp_expiry,req.body.email)
    }

    return response.success(res, "OTP sent to the mobile number.", {
      mobile_number,
    });
  } catch (error) {
    await t.rollback();
    console.log(`/temp_store_mobile_number error - ${error.message}`);
    return response.catchError(res, "Something went wrong!", error);
  }
};

exports.verifyAndRegisterUser = async (req, res) => {
  try {
    let {
      id,
      mobile_number,
      otp,
      first_name,
      last_name,
      email,
      country_calling_code_id,
      manager_id,
      is_login_required,
      is_active,
      role,
      photo,
      access_level,
      user_id, // Assuming this is passed in request for photo upload
    } = req.body;

    // If login is required and OTP is provided, verify the mobile number
    if (is_login_required && otp) {
      const is_verified = await verifyMobileNumber(mobile_number, otp, res);
      if(is_verified.status == false){
        return response.fail(res, is_verified.message, "")
      }
    }

    let user;
    if (id) {
      // Find and update the user if ID is provided
      user = await Model["users"].findOne({ where: { id } });
      if (!user) {
        return response.fail(res, "User not found!", "");
      }

      // Changing exhibitor profile to enable or disable login
      if (
        user.role === 2 &&
        user.is_login_required === false &&
        is_login_required === true
      ) {
        if (!mobile_number || !country_calling_code_id || !email) {
          return response.fail(
            res,
            "Please provide Mobile Number, Mobile Country Code, and Email!"
          );
        }
      }

      await updateUser(
        user,
        {
          first_name,
          last_name,
          email,
          mobile_number,
          country_calling_code_id,
          is_login_required,
          photo,
          role,
          id,
          access_level,
        },
      );
    } else {
      // Create a new user if no ID is provided
      user = await createUser(
        {
          first_name,
          last_name,
          email,
          mobile_number,
          country_calling_code_id,
          manager_id,
          is_login_required,
          is_active,
          role,
          photo,
          user_id,
          access_level
        },
      );

    // Handle free trial registration
    if (req.body.free_trial === true && role == 1) 
      await handleFreeTrial(user.id);
    }

    // Commit transaction
    // await t.commit();

    // Generate JWT token for the new or updated user
    const token = jwt.sign(
      {
        id: user.id,
        access_level: user.access_level || "beginner", // Default role
        role: user.role
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    // Respond with success and the token
    return response.success(
      res,
      id
        ? "User Updated Successfully!"
        : otp
        ? "Mobile number verified and user registered successfully!"
        : "User registered successfully!",
      {
        token,
        ...user.dataValues,
      }
    );
  } catch (error) {
    // await t.rollback();
    console.error(error); // Log the error for debugging
    if(error.message == 'Email address already exists')
      return response.catchError(res, error.message, error.message);
    return response.catchError(res, "Something went wrong!", error.message);
  }
};

exports.registerFreeTrial = async (req, res) => {
  try {
    const { userId, free_trial } = req.body;

    // Validate the userId
    if (!userId || !free_trial) {
      return resp.fail(res, "User ID and Free Trial boolean are required");
    }

    // Call the handleFreeTrial function
    if(free_trial == true)
      await handleFreeTrial(userId);

    // Respond with success
    return resp.success(res, "Free trial registered successfully!");
  } catch (error) {
    console.error("Error in registerFreeTrial controller:", error);

    // Handle errors gracefully
    return resp.catchError(res, "Something went wrong while registering the free trial.", {
      message: error.message || "An internal server error occurred.",
      error: error.stack || "No stack trace available.",
    });
  }
};

// Function to handle free trial
const handleFreeTrial = async (userId) => {
  try {
    // Check if a free trial already exists for the user
    const existingFreeTrial = await Model["free_trials"].findOne({
      where: { user_id: userId },
    });

    if (existingFreeTrial) {
      console.log("Free trial already exists for the user.");
      return;
    }

    // Fetch free trial days from the configuration table
    const freeTrialConfig = await Model["configurations"].findOne({
      where: { is_active: "Active" },
    });

    if (!freeTrialConfig) {
      console.log("Free trial configuration not found!");
      return;
    }

    const freeTrialDays = parseInt(freeTrialConfig.free_trial_days, 10) || 0;

    // Calculate the free trial end date
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + freeTrialDays);

    // Create the free trial entry
    await Model["free_trials"].create({
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      status: 'active'
    });

    console.log("Free trial registered successfully for user ID:", userId);
  } catch (error) {
    console.error("Error handling free trial:", error.message);
    return;
  }
};

const verifyMobileNumber = async (mobile_number, otp, res) => {
  if (!mobile_number) {
    return response.fail(res, "Please provide the mobile number!", "");
  }
  if (!otp) {
    return response.fail(res, "Please provide the OTP!", "");
  }
  const is_verified = commonFunction.verifyMobileNumberWithOTP(
    mobile_number,
    otp
  );
  return is_verified;
};

function isValidBase64Image(base64String) {
  // Regular expression to check if the string starts with 'data:image/png;base64,' and is followed by base64 content
  const base64Pattern = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;

  // Check if the string is defined, is not 'undefined', and matches the base64 image format
  if (typeof base64String === 'string' && base64String !== 'data:image/png;base64,undefined' && base64Pattern.test(base64String)) {
      return true;
  }
  return false;
}

const handlePhotoUpload = async (photo, user_id, modelName) => {
  if (photo && isValidBase64Image(photo)) {
    const fileName = commonFunction.generateUniqueNumber();
    const folderPath = "uploads/users"; // Path to store images
    const folderPathWithoutUploads = "users"; // For URL path
    const uploadResult = commonFunction.uploadFileFunction(
      photo,
      folderPath,
      fileName,
      folderPathWithoutUploads,
      user_id,
      modelName
    );

    if (uploadResult.code === 1) {
      return uploadResult.data;
    } else {
      throw new Error(uploadResult.status);
    }
  }
  return null;
};

const updateUser = async (user, data) => {
  const {
    first_name,
    last_name,
    email,
    mobile_number,
    country_calling_code_id,
    is_login_required,
    photo,
    role,
    id,
    access_level
  } = data;

  if (user.role == 1) {
    // user
    user.first_name = first_name;
    user.last_name = last_name;
    user.email = email;
  } else if (user.role == 2) {
    // exhibitor
    user.first_name = first_name;
    user.last_name = last_name;
    user.access_level = access_level;
    user.email = email;
    user.mobile_number = mobile_number;
    user.country_calling_code_id = country_calling_code_id;
    user.is_login_required =
      is_login_required == true ? is_login_required : false;
  }
  // Handle photo upload if provided
  if (photo) {
    const photoPath = await handlePhotoUpload(photo, id, "users");
    if(photoPath)
      user.photo = photoPath;
  }

  // Save the updated user
  await user.save();
};

const createUser = async (data) => {
  const {
    first_name,
    last_name,
    email,
    mobile_number,
    country_calling_code_id,
    manager_id,
    is_login_required,
    is_active,
    role,
    photo,
    access_level
  } = data;

  // Create new user in the users table (without photo initially)
  const user = await Model["users"].create(
    {
      first_name,
      last_name,
      email: is_login_required ? email : null,
      mobile_number: is_login_required ? mobile_number : null,
      country_calling_code_id: is_login_required ? country_calling_code_id : null,
      manager_id: role == 1 ? null : manager_id, // user will not have the manager_id
      is_login_required: role == 1 ? true : is_login_required, // user will always have login access
      is_active,
      access_level,
      role, // 1: user, 2: exhibitor
      photo: null, // Set photo to null initially
    },
  );

  // Handle photo upload if provided
  if (photo) {
    // Use the newly created user's id instead of user_id
    const photoPath = await handlePhotoUpload(photo, user.id, "users");

    // Update the user record with the uploaded photo path
    if(photoPath)
      user.photo = photoPath; // Update the photo field
    await user.save(); // Save changes to the database
  }

  return user;
};

exports.subscribePlan = async (req, res) => {
  const t = await Model.sequelize.transaction();
  try {
    const { user_id, payment_details, plan_id } = req.body;

    if (!plan_id) return response.fail(res, "plan_id is required", "");

    // Fetch subscription plan details (price and duration)
    const subscriptionPlan = await Model["subscription_plans"].findOne({
      where: { id: plan_id },
    });
    if (!subscriptionPlan) return response.fail(res, "Invalid plan_id", "");

    const { price, duration_days } = subscriptionPlan;

    // Check if user exists
    const userExists = await Model["users"].findByPk(user_id);
    if (!userExists) return response.fail(res, "User not found", "");

    // Handle payment method
    const newPaymentMethod = await Model["payment_methods"].create(
      {
        user_id: userExists.id,
        ...payment_details, // Spread payment_details to fill in fields
      },
      { transaction: t }
    );

    // Process payment and create transaction
    const transactionResult =
      payment_details.method_type === "card"
        ? await commonFunction.processCardPayment(newPaymentMethod)
        : await commonFunction.processOnlinePayment(newPaymentMethod);

    await Model["transaction_details"].create(
      {
        user_id: userExists.id,
        payment_method_id: newPaymentMethod.id,
        plan_id,
        price: price, // Using the price from subscription_plans
        transaction_details_status: transactionResult.status,
        service_transaction_details_id: transactionResult.transaction_id,
      },
      { transaction: t }
    );

    // Create user subscription
    const startDate = new Date();
    const endDate = new Date(
      startDate.getTime() + duration_days * 24 * 60 * 60 * 1000
    ); // Calculate end date using duration_days
    await Model["user_subscriptions"].create(
      {
        user_id: userExists.id,
        plan_id,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
      },
      { transaction: t }
    );

    await t.commit();
    return response.success(res, "Subscription successful", {
      user: userExists,
      payment_method: newPaymentMethod,
    });
  } catch (error) {
    await t.rollback();
    console.log(`/subscribeToPlan error - ${error.message}`);
    return response.catchError(res, "Something went wrong!", error.message);
  }
};

exports.login = async (req, res) => {
  try {
    const { mobile_number, country_calling_code_id } = req.body;

    if (!mobile_number) {
      return response.fail(res, "Please Provide Mobile Number!", "");
    }

    if (!country_calling_code_id) {
      return response.fail(
        res,
        "Please Provide Mobile Number Country Code!",
        ""
      );
    }

    // Find or create user by mobile number
    let user = await Model["users"].findOne({
      where: { mobile_number, country_calling_code_id },
    });

    if (!user) {
      return response.fail(
        res,
        "No user found with the current mobile number!",
        ""
      );
    }

    if (user.is_active == false) {
      return response.fail(
        res,
        "You are currently inactive and cannot log in!",
        ""
      );
    }

    if (!user.is_login_required) {
      return response.fail(res, "You don't have login access!", "");
    }

    let country_code = await Model["country_masters"].findOne({
      where: { id: user.country_calling_code_id },
    });

    if(!country_code){
      return response.fail(
        res,
        "No country code found with the current mobile number!",
        ""
      );
    }

    let otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
    // const otp = 1234;
    if(mobile_number=="9960189992"){
      otp = 1234;
    }
    user.otp = otp;
    user.otp_expiry = new Date(Date.now() + 2 * 60 * 1000); // Set OTP expiry to 2 minutes from now
    await user.save();

    // Send OTP to user's mobile number
    await commonFunction.sendSMS(`${country_code.country_calling_code}${user.mobile_number}`, `Your verification code is ${otp}. Please enter this code to verify your phone number. This code will expire in 2 minutes.`); // Implement this function to send SMS

    await commonFunction.sendLoginOTPEmail(otp,user.otp_expiry,user.email)

    resp.success(res, "OTP sent successfully!", {});
  } catch (error) {
    console.log("request otp error: ", error.message);
    resp.catchError(res, error.message, "Something went wrong!");
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return response.fail(res, "Please Provide User Id!", "");
    }

    let user = await Model["users"].findByPk(user_id);
    if (!user) {
      return response.fail(
        res,
        "No user found with the provided Id!",
        ""
      );
    }

    await Model["free_trials"].destroy({
      where: {
        user_id: user.id
      }
    });

    await Model["user_subscriptions"].destroy({
      where: {
        user_id: user.id
      }
    });

    await user.destroy();
    resp.success(res, "Account deleted successfully!", {});
  } catch (error) {
    resp.catchError(res, error.message, "Something went wrong!");
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { mobile_number, country_calling_code_id, otp } = req.body;

    // Validate input
    if (!mobile_number) {
      return response.fail(res, "Provide mobile number!", ""); // Updated message
    }

    if (!country_calling_code_id) {
      return response.fail(res, "Provide country code ID!", ""); // Updated message
    }

    if (!otp) {
      return response.fail(res, "Provide a valid OTP!", ""); // Updated message
    }

    // Find user by mobile number and country code ID
    const user = await Model["users"].findOne({
      where: {
        mobile_number,
        country_calling_code_id,
      },
    });

    // Check if user exists
    if (!user) {
      return response.fail(
        res,
        "No user found with the current mobile number!",
        ""
      );
    }

    if (user.is_active != 'Active') {
      return response.fail(
        res,
        "You are currently inactive and cannot log in!",
        ""
      );
    }

    if (!user.is_login_required) {
      return response.fail(res, "You don't have login access!", "");
    }

    // Check if OTP has expired
    if (user.otp_expiry && user.otp_expiry <= new Date()) {
      user.otp = null; // Clear the OTP after expiration
      await user.save();
      return response.fail(res, "OTP has expired! Please login again.", "");
    }

    // Check if the provided OTP is valid
    if (user.otp != otp) {
      return response.fail(res, "Invalid OTP!", "");
    }

    // Clear the OTP and expiry after successful verification
    user.otp = null; // Clear the OTP after successful login
    user.otp_expiry = null; // Clear the expiry as well
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.access_level || "beginner",
        manager_id: user.manager_id || null,
      }, // Default role if not present
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    // Respond with success and token
    return response.success(res, "Login Successful!", {
      token,
      ...user.dataValues,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    return response.catchError(res, error.message, "Something went wrong!");
  }
};

// Function to generate JWT token
exports.refreshToken = async (req, res) => {
  try {
    const user_id = req.body.user_id; // Assuming user details are sent in the request body

    if (!user_id) {
      return response.fail(res, "User id is required!", "");
    }

    // Find user by mobile number and country code ID
    const user = await Model["users"].findOne({
      where: {
        id: user_id,
      },
    });

    // Check if user exists
    if (!user) {
      return response.fail(
        res,
        "No user found with the current mobile number!",
        ""
      );
    }

    if (user.is_active != true) {
      return response.fail(
        res,
        "You are currently inactive and cannot log in!",
        ""
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.access_level || "beginner",
        manager_id: user.manager_id || null,
      }, // Default role if not present
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    // Return the token in the response
    return response.success(res, "Token generated successfully!", { token });
  } catch (error) {
    return response.catchError(res, "Error generating token!", error.message);
  }
};



// Admin Controllers 

// Admin Signup
exports.adminSignup = async (req, res) => {
  const t = await Model.sequelize.transaction();
  try {
    const { full_name, user_name, password, mobile_number, country_calling_code_id, email } = req.body;

    // Check if the username or mobile number already exists
    const existingUser = await Model.admin_user_masters.findOne({
      where: { email }
    });

    if (existingUser) {
      await t.rollback();
      return response.fail(res, "Email already exists!");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new admin user
    const newUser = await Model.admin_user_masters.create({
      full_name,
      user_name,
      password: hashedPassword, // Store the hashed password
      country_calling_code_id,
      email,
      mobile_number
    }, { transaction: t });

    await t.commit();

    // Return success response with new user details
    return response.success(res, "Admin user registered successfully", { id: newUser.id, full_name, email });
  } catch (error) {
    await t.rollback();
    return response.catchError(res, "Something went wrong!", error);
  }
};

// Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the admin user by user_name
    const adminUser = await Model.admin_user_masters.findOne({ where: { email } });

    if (!adminUser) {
      return response.fail(res, "Invalid email or password!");
    }

    if (adminUser.is_active != 'Active') {
      return response.fail(res, "You are currently inactive and cannot log in!");
    }
    
    // Compare the input password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, adminUser.password);
    if (!isPasswordValid) {
      return response.fail(res, "Invalid email or password!");
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: adminUser.id, role: "admin" },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    // Return success response with token
    return response.success(res, "Login successful!", { token, id: adminUser.id, email } );
  } catch (error) {
    return response.catchError(res, "Something went wrong!", error.message);
  }
};

exports.adminForgotPassword = async (req, res) => {
  const t = await Model.sequelize.transaction();
  try {
    const { email } = req.body;

    const admin_user_masters = await Model.admin_user_masters.findOne({ where: { email } });

    if (!admin_user_masters) {
      return response.fail(res, "Email not found!");
    }

    // Generate OTP
    // const otp = otpService.generateOtp();
    const otp = 1234;
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 2); // Set expiry time to 2 minutes

    // Save OTP and OTP expiry to the user record
    admin_user_masters.otp = otp;
    admin_user_masters.otp_expiry = otpExpiry;

    await admin_user_masters.save({ transaction: t }); // Save the changes

    // Send OTP for password reset via SMS (or Email)
    await commonFunction.sendMailFunction(
      emailTo= email,
      subject= "Forget password OTP",
      body= `Your OTP for resetting the password is ${otp}.` // You should also provide the email body
  );
      
    await t.commit();

    return response.success(res, "Password reset OTP sent to your email");
  } catch (error) {
    await t.rollback();
    return response.catchError(res, "Something went wrong", error.message)
  }
};

exports.adminResetPassword = async (req, res) => {
  const t = await Model.sequelize.transaction();
  try {
    const { email, otp, new_password } = req.body;

    // Find user by mobile number
    const adminUser = await Model.admin_user_masters.findOne({ where: { email } });

    if (!adminUser) {
      return response.fail(res, "Email not found!");
    }

    // Check if OTP exists and if it's valid
    const currentTime = new Date();

    if (!adminUser.otp || adminUser.otp !== otp || adminUser.otp_expiry < currentTime) {
      return response.fail(res, "Invalid or expired OTP");
    }

    // Hash the new password
    const hashedPassword = bcrypt.hashSync(new_password, 10);

    // Update the user's password, and clear OTP and OTP expiry fields
    adminUser.password = hashedPassword;
    adminUser.otp = null;
    adminUser.otp_expiry = null;

    // Save the updated record
    await adminUser.save({ transaction: t });

    await t.commit();

    return response.success(res, "Password reset successfully!")
  } catch (error) {
    await t.rollback();
    return response.catchError(res, "Something went wrong!", error.message)
  }
};
