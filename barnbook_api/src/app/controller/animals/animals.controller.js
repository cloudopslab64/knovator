const Model = require("../../models");
var commonfunction = require("../commanfunction/commanfunction.controller");
var response = require("../../middleware/response.middleware");
const { Op, fn, col, literal } = require("sequelize");
const sequelize = require("sequelize");
const moment = require('moment'); 
const { success, fail, catchError, vaildationError } = response; // Assuming response.js is the file with the methods

// Controller function to get animals by user
const getAnimalsByUser = async (req, res) => {
  const { user_id } = req.body; // Get user_id from request body

  try {
    const Animal = Model['animals'];
    const AnimalCategory = Model['animal_categories'];

    let whereCondition = {
      user_id: user_id
    };
    if (req.body.exhibitor_id) {
      whereCondition.exhibitor_id = req.body.exhibitor_id;
    }
    // Step 1: Find distinct animal categories from the animals table for the given user
    const animalCategories = await Animal.findAll({
      attributes: ['animal_category_id'],
      where: whereCondition,
      group: ['animal_category_id'], // Group by animal_category_id to get distinct categories
      raw: true
    });

    // Step 2: Fetch animals for each category
    const categoryPromises = animalCategories.map(async (category) => {
      // Fetch the category name from the animal_category table (use correct column 'category' for label)
      const categoryDetails = await AnimalCategory.findOne({
        where: { id: category.animal_category_id, is_active: 'Active' }, // Filter out inactive categories
        attributes: ['category'], // Adjust the column name here to 'category'
        raw: true
      });

      if (!categoryDetails) return null; // Skip if category doesn't exist or is inactive

      whereCondition = {
        animal_category_id: category.animal_category_id,
        user_id: user_id
      };
      
      // Add exhibitor_id condition if it exists in req.body
      if (req.body.exhibitor_id) {
        whereCondition.exhibitor_id = req.body.exhibitor_id;
      }
      // Fetch all animals under this category for the given user
      const animals = await Animal.findAll({
        where: whereCondition,
        attributes: ['id', 'cattle_name'],
        raw: true
      });

      // Structure the animals into the required format
      const children = animals.map(animal => ({
        label: animal.cattle_name,
        value: animal.id
      }));

      // Return category label and children
      return {
        label: categoryDetails.category, // Use the 'category' column for the label
        value: category.animal_category_id,
        children: children
      };
    });

    // Step 3: Resolve all category promises, filter out null values (inactive categories)
    const categoriesWithAnimals = await Promise.all(categoryPromises);
    const validCategories = categoriesWithAnimals.filter(category => category !== null);

    whereCondition = {
      user_id: user_id
    };
    if (req.body.exhibitor_id) {
      whereCondition.exhibitor_id = req.body.exhibitor_id;
    }

    // Step 4: Fetch all animals for the user (irrespective of category)
    const allAnimals = await Animal.findAll({
      where: whereCondition,
      attributes: ['id', 'cattle_name'],
      raw: true
    });

    // Structure 'All Animals' category
    const allAnimalsEntry = {
      label: 'All Animals',
      value: 'all',
      children: allAnimals.map(animal => ({
        label: animal.cattle_name,
        value: animal.id
      }))
    };

    // Step 5: Combine 'All Animals' with other categories
    const finalResult = [allAnimalsEntry, ...validCategories];

    // Return success response
    success(res, 'Animal categories and animals fetched successfully', finalResult, finalResult.length);
  } catch (error) {
    console.error(error);
    catchError(res, 'Failed to fetch animal categories and animals', error);
  }
};

const searchExhibitorAndAnimal = async (req, res) => {
  try {
      const managerId = req.body.user_id; 
      const searchKeyword = req.body.search || ''; 

      // Fetching subordinates (exhibitors) from the users table
      const exhibitors = await Model.users.findAll({
          attributes: [
              'id',
              [sequelize.fn('CONCAT', sequelize.col('first_name'), ' ', sequelize.col('last_name')), 'name'],
              'photo',
              [sequelize.literal("'exhibitor'"), 'type']
          ],
          where: {
              manager_id: managerId,
              role: 2,
              is_active: "Active",
              [Op.and]: sequelize.where(
                  sequelize.fn('CONCAT', sequelize.col('first_name'), ' ', sequelize.col('last_name')),
                  {
                      [Op.like]: `%${searchKeyword}%`
                  }
              )
          }
      });

      // Fetching animals from the animals table
      const animals = await Model.animals.findAll({
          attributes: [
              'id',
              ['cattle_name', 'name'],
              'photo',
              [sequelize.literal("'animal'"), 'type']
          ],
          where: {
              user_id: managerId,
              is_active: "Active",
              cattle_name: {
                  [Op.like]: `%${searchKeyword}%`
              }
          }
      });

      // Combine the results
      const combinedResults = [...exhibitors, ...animals];
      return response.success(res, "Data Fetch Successfully!", combinedResults)

  } catch (error) {
      console.error('Error fetching data:', error);
      return response.fail(res, "Internal server error", error.message);
  }
};
  
module.exports = {
  getAnimalsByUser, searchExhibitorAndAnimal
};

