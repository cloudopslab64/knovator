const express = require("express");
const master = require("../../controller/masters/masters.controller");
const animal = require("../../controller/animals/animals.controller");
const homeScreen = require("../../controller/homeScreen/homeScreen.controller");
const report = require("../../controller/reports/reports.controller");

const router = express.Router();
const dynamicMulter = require('../../middleware/dynamicMulter.middleware');  // Import the middleware


router.get("/", (req, res) => {
  res.json({
    status: 200,
    message: "This is master page!",
  });
});

router.get("/modelList", master.modelList);
router.get("/columnListByModel/:modelName", master.columnListByModel);

// dynamic APIs
router.post("/saveRecords", master.saveRecords);
router.post("/getRecords", master.getRecords);
router.post("/updaterelationaldata", master.updaterelationaldata);
router.post("/softDeleteRecord", master.softDeleteRecord);
router.post("/bulkUpdate", master.bulkUpdate);

// upload binary file using multer
router.post("/uploadBinaryFile", dynamicMulter, master.uploadBinaryFile);

// sync database
router.post("/syncDatabase", master.syncDatabase);

// country code
router.post("/createCountryCode", master.saveRecords);
router.post("/listCountryCode", master.getRecords);

// country
router.post("/getCountryListing", master.getRecords);
router.post("/createCountry", master.saveRecords);
router.post("/updateCountry", master.saveRecords);

//state
router.post("/getStateListing", master.getRecords);
router.post("/createState", master.saveRecords);
router.post("/updateState", master.saveRecords);

// subscription
router.post("/createSubscriptionPlans", master.saveRecords);
router.post("/listSubscriptionPlans", master.getRecords);

// profile
router.post("/showUserProfile", master.getRecords);
router.post("/updateUserProfile", master.saveRecords);
router.post("/getMyAnimals", master.getRecords);

// add animal --> dropdowns
router.post("/createAnimalCategory", master.saveRecords);
router.post("/createAnimalBreed", master.saveRecords);
router.post("/createAnimalSex", master.saveRecords);
router.post("/createAnimalShowType", master.saveRecords);

router.post("/listAnimalCategory", master.getRecords);
router.post("/listAnimalBreed", master.getRecords);
router.post("/listAnimalSex", master.getRecords);
router.post("/listAnimalShowType", master.getRecords);
router.post("/listExhibitors", master.getRecords);

router.post("/saveFreeTrialAllowedAnimal", master.saveRecords);

// create animal
router.post("/createAnimalProfile", master.saveRecords);
router.post("/updateAnimalProfile", master.saveRecords);
router.post("/deleteAnimal", master.saveRecords);

// animal listing
router.post("/addAnimalToArchived", master.saveRecords);
router.post("/listNonArchivedAnimals", master.getRecords);
router.post("/listArchivedAnimals", master.getRecords);
router.post("/listAllAnimals", master.getRecords);

// cattle (animal) details
router.post("/getAnimalDetails", master.getRecords);

// animal feed
router.post("/createRation", master.saveRecords);
router.post("/getRationList", master.getRecords);
router.post("/createFeedSchedule", master.saveRecords);
router.post("/updateFeedSchedule", master.saveRecords);
router.post("/updateFeedSchedule", master.saveRecords);
router.post("/getCurrentFeedSchedule", master.getRecords);
router.post("/getFeedScheduleLogs", master.getRecords);
router.post("/removeFeedSchedule", master.saveRecords);

// animal exercise
router.post("/createExercise", master.saveRecords);
router.post("/getExerciseListing", master.getRecords);
router.post("/createExerciseSchedule", master.saveRecords);
router.post("/updateExerciseSchedule", master.saveRecords);
router.post("/getCurrentExerciseSchedule", master.getRecords);
router.post("/getExerciseLogs", master.getRecords);

// water intak
router.post("/addWaterIntake", master.saveRecords);
router.post("/getWaterIntakeListing", master.getRecords);
router.post("/getAverageWaterIntake", master.getAverageWaterIntake);
router.post("/getWaterLogsHistory", master.getLogsHistory);

// weight
router.post("/addWeight", master.saveRecords);
router.post('/getWeightLogsHistory', master.getLogsHistory);
router.post("/createTargetWeight", master.saveRecords);

// Breeding
router.post("/addUpdateBreeding", master.saveRecords);

// ID
  // Validation Tag
  router.post("/addValidationTag", master.saveRecords);
  router.post("/updateValidationTag", master.saveRecords);

  // Premise Tage
  router.post("/createPremiseTag", master.saveRecords);
  router.post("/updatePremiseTag", master.saveRecords);
  
  // Tattoo
  router.post("/createTattoo", master.saveRecords);
  router.post("/updateTattoo", master.saveRecords);

  // Brand
  router.post("/createBrand", master.saveRecords);
  router.post("/updateBrand", master.saveRecords);

  // EID
  router.post("/createEID", master.saveRecords);
  router.post("/updateEID", master.saveRecords);

// Med/Vet
  // Veterinarian Routes
  router.post("/createVeterinarian", master.saveRecords);  // Create Veterinarian
  router.post("/listVeterinarian", master.getRecords);      // List Veterinarian
  router.post("/updateVeterinarian", master.saveRecords);  // Update Veterinarian

  // Vaccine Routes
  router.post("/createVaccine", master.saveRecords);       // Create Vaccine
  router.post("/listVaccine", master.getRecords);           // List Vaccine
  router.post("/updateVaccine", master.saveRecords);       // Update Vaccine

  // Medine Routes
  router.post("/createMedicine", master.saveRecords);
  router.post("/updateMedicine", master.saveRecords);
  router.post("/listMedicine", master.getRecords);


  // Treatment Routes
  router.post("/createTreatment", master.saveRecords);     // Create Treatment
  router.post("/listTreatment", master.getRecords);         // List Treatment
  router.post("/updateTreatment", master.saveRecords);     // Update Treatment

  // Document Routes
  router.post("/createDocument", master.saveRecords);      // Create Document
  router.post("/listDocument", master.getRecords);          // List Document
  router.post("/updateDocument", master.saveRecords);      // Update Document

// Shows
router.post("/getAnimalsByUser", animal.getAnimalsByUser);
router.post("/createShow", master.saveRecords);
router.post("/updateShow", master.saveRecords);
router.post("/listUpcomingShow", master.getRecords);
router.post("/listPastShow", master.getRecords);
router.post("/getShowDetails", master.getRecords);
router.post("/updateShowRecords", master.saveRecords);
router.post("/animalShows", master.getRecords);
router.post("/getUpcomingAnimalShows", master.getRecords);
router.post("/getPastAnimalShows", master.getRecords);

// events
router.post("/createEvent", master.saveRecords);
router.post("/updateEvent", master.saveRecords);
router.post("/listEvents", master.getRecords);

// animal notes
router.post("/saveAnimalNote", master.saveRecords);

// notifications
router.post("/notificationList", homeScreen.fetchNotifications);
router.post("/readNotificationUpdate", master.bulkUpdate);
router.post("/getUnreadNotificationCount", master.getUnreadNotificationCount);

// Category
router.post("/getCreatedAnimalCategories", master.getRecords);
router.post("/getCategoryWiseAnimalsListing", master.getRecords);

// Animal Category routes
router.post("/createAnimalCategory", master.saveRecords);  // Create Animal Category
router.post("/updateAnimalCategory", master.saveRecords);  // Update Animal Category
router.post("/listAnimalCategory", master.getRecords);     // List Animal Categories

// Breed routes
router.post("/createBreed", master.saveRecords);           // Create Breed
router.post("/updateBreed", master.saveRecords);           // Update Breed
router.post("/listBreed", master.getRecords);              // List Breeds

// Free Trial routes
router.post("/getFreeTrialDays", master.getRecords);     // Get Free Trial Days
router.post("/updateFreeTrial", master.saveRecords);     // Update Free Trial

router.post("/getPolicies", master.getRecords);
router.post("/getSubscriptionsList", master.getRecords);

router.post("/getLogs", master.getLogs);

router.post("/getWeightTarget", master.getWeightTarget);
router.post("/saveWeightTarget", master.saveRecords);

// Exhibitor Details
router.post("/createCampContest", master.saveRecords);
router.post("/upcomingCampContestListing", master.getRecords);
router.post("/pastCampContestListing", master.getRecords);
router.post("/updateCampContest", master.saveRecords);
router.post("/saveChecklist", master.saveRecords);
router.post("/saveParentNotes", master.saveRecords);
router.post("/saveCounselorNotes", master.saveRecords);
router.post("/createYQMCA", master.saveRecords);
router.post("/createAssociation", master.saveRecords);
router.post("/createTaxDocuments", master.saveRecords);
router.post("/updateYQMCA", master.saveRecords);
router.post("/updateAssociation", master.saveRecords);
router.post("/updateTaxDocuments", master.saveRecords);
router.post("/listYQMCA", master.getRecords);
router.post("/listAssociation", master.getRecords);
router.post("/listTaxDocuments", master.getRecords);


// Batch Records
router.post("/createBatchVaccine", master.saveRecords);
router.post("/createBatchTreatment", master.saveRecords);
router.post("/createBatchWeight", master.saveRecords);
router.post("/createBatchWater", master.saveRecords);


router.post("/getFreeTrialsWithUsers", report.getFreeTrialsWithUsers);
router.post("/getExpiredSubscriptions", report.getExpiredSubscriptions);
router.post("/getTotalSubscriptionRevenue", report.getTotalRevenue);
router.post("/churnRateReport", report.churnRateReport);
router.post("/trialConversionReport", report.trialConversionReport);
router.post("/getUserAcquisitionReport", report.getUserAcquisitionReport)
router.post("/getActiveSubscriptionReport", master.getRecords);

router.post("/searchExhibitorAndAnimal", animal.searchExhibitorAndAnimal);

router.post("/landingScreen", homeScreen.landingScreen);

router.get("/deleteAccount/:user_id", homeScreen.deleteAccount);
router.get("/deleteAccount", homeScreen.deleteAccount);

module.exports = router;