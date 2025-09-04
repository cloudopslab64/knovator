'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class shows extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.users, {
        foreignKey: 'user_id',
        as: 'users',
      });
      this.belongsTo(models.animals, {
        foreignKey: 'animal_id',
        as: 'animals',
      });
      this.hasMany(models.animal_shows, {
        foreignKey: 'show_id',
        as: 'animal_shows',
      });
    }
  }
  shows.init({
    user_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    banner_image: DataTypes.STRING,
    date: DataTypes.DATE,
    time: DataTypes.STRING,
    city: DataTypes.STRING,
    location: DataTypes.STRING,
    judges: DataTypes.JSONB,
    fees: DataTypes.STRING,
    type: DataTypes.STRING,
    sactioned_by: DataTypes.STRING,
    show_notes: DataTypes.STRING,
    checklist: DataTypes.JSONB,
    selected_animals: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    is_active: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',  // Set the default value to 'Active'
    }  }, {
    sequelize,
    modelName: 'shows',
    hooks: {
      afterCreate: async (showInstance, options) => {
        // Set a default banner image if not provided
        if (!showInstance.banner_image) {
          showInstance.banner_image = 'uploads/defaultImages/shows.jpg';
          await showInstance.save(); // Save the instance with the updated value
        }
      },
      afterSave: async (instance, options) => {
        const inputData = options.context?.inputData ?? {};  // Safely access inputData
        const selected_animals = inputData.selected_animals ?? [];  // Default to empty array
        const user_id = inputData.user_id;  // Assuming user_id is coming from inputData
        const show_id = instance.id;  // Assuming show_id is coming from instance

        if (selected_animals.length > 0) {
          const existingAnimalShows = await sequelize.models.animal_shows.findAll({
            where: {
              user_id,
              show_id,
            },
            attributes: ['animal_id', 'is_active'],
          });
      
          const existingAnimalIds = existingAnimalShows.map(show => show.animal_id);
          const inactiveAnimals = existingAnimalShows
            .filter(show => show.is_active === 'Inactive')
            .map(show => show.animal_id);
      
          // 1. Mark animals as inactive if not in selected_animals
          const animalsToMarkInactive = existingAnimalIds.filter(
            animal_id => !selected_animals.includes(animal_id)
          );
      
          if (animalsToMarkInactive.length > 0) {
            await sequelize.models.animal_shows.update(
              { is_active: 'Inactive' },
              {
                where: {
                  user_id,
                  show_id,
                  animal_id: animalsToMarkInactive,
                },
              }
            );
            console.log(`Marked as inactive: ${animalsToMarkInactive.join(', ')}`);
          }
      
          // 2. Reactivate animals if they are in selected_animals but marked as Inactive
          const animalsToReactivate = selected_animals.filter(
            animal_id => inactiveAnimals.includes(animal_id)
          );
      
          if (animalsToReactivate.length > 0) {
            await sequelize.models.animal_shows.update(
              { is_active: 'Active' },
              {
                where: {
                  user_id,
                  show_id,
                  animal_id: animalsToReactivate,
                },
              }
            );
            console.log(`Reactivated animals: ${animalsToReactivate.join(', ')}`);
          }
      
          // 3. Insert new records for animals not already in the animal_shows table
          const animalsToAdd = selected_animals.filter(
            animal_id => !existingAnimalIds.includes(animal_id)
          );
      
          if (animalsToAdd.length > 0) {
            const newRecords = animalsToAdd.map(animal_id => ({
              user_id,
              show_id,
              animal_id,
              is_active: 'Active',
              show_records: {},  // You can modify this field if necessary
            }));
      
            await sequelize.models.animal_shows.bulkCreate(newRecords);
            console.log(`Added new animals: ${animalsToAdd.join(', ')}`);
          }
        }
      },      
    },
  });

  const validateShowRecords = (instance) => {
    const { type, show_records } = instance;

    const validationRules = {
      Major: ['weigh_in', 'weigh_back', 'class', 'wave', 'pricing', 'awards', 'points', 'notes', 'make_sale', 'slot', 'buyer', 'price'],
      Jackpot: ['name', 'date', 'time', 'city', 'location', 'judges', 'ring_details', 'fees', 'sactioned_by'],
      County: ['weigh_in', 'weigh_back', 'class', 'wave', 'pricing', 'awards', 'points', 'notes', 'make_sale', 'slot', 'buyer', 'price'],
      Fair: ['weigh_in', 'weigh_back', 'class', 'wave', 'pricing', 'awards', 'points', 'notes', 'make_sale', 'slot', 'buyer', 'price'],
      Expo: ['weigh_in', 'weigh_back', 'class', 'wave', 'pricing', 'awards', 'points', 'notes', 'make_sale', 'slot', 'buyer', 'price'],
    };

    const requiredFields = validationRules[type];
    
    if (!requiredFields) {
      throw new Error(`Invalid type: ${type}`);
    }

    // Check if show_records contains all required fields
    for (const field of requiredFields) {
      if (!show_records || !show_records.hasOwnProperty(field)) {
        throw new Error(`Missing required field "${field}" for type "${type}" in show_records.`);
      }
    }
  };

  const addAnimalDetails = async (instances) => {
    // Check if instances is an array or a single instance
    const showInstances = Array.isArray(instances) ? instances : [instances];

    console.log(JSON.stringify(showInstances, null, 2));

    for(let i = 0; i<showInstances.length; i++){
      const element = showInstances[i];
      const animalIds = element.selected_animals;
      
      if(Array.isArray(animalIds) && animalIds.length){
        const animalDetails = await sequelize.models.animals.findAll({
          where: {
            id: animalIds,
          },
        });
        if(animalDetails)
          element['selected_animals'] = animalDetails;
      }
    }
  };

  return shows;
};