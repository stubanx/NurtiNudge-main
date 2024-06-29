const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const csv = require('csv-parser');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());

let foodItems = [];

// Read nutrients data from CSV file
fs.createReadStream('views\nutrients.csv')
    .pipe(csv())
    .on('data', (data) => {
        foodItems.push(data);
    })
    .on('end', () => {
        console.log('Nutrients data loaded.');
    });

// Endpoint to handle diet plan requests
app.post('/api/diet-plan', (req, res) => {
    const user = req.body;
    const mealPlan = generateMealPlan(user);
    res.json(mealPlan);
});

// Function to generate the meal plan
function generateMealPlan(user) {
    const calorieTarget = calculateCalorieTarget(user);
    const mealPlan = {
        breakfast: getMeals('breakfast', user, calorieTarget / 4),
        lunch: getMeals('lunch', user, calorieTarget / 4),
        dinner: getMeals('dinner', user, calorieTarget / 4),
        snack: getMeals('snack', user, calorieTarget / 4),
        totalCalories: calorieTarget
    };
    return mealPlan;
}

function calculateCalorieTarget(user) {
    const bmr = user.gender === 'male' ?
        88.362 + (13.397 * user.weight) + (4.799 * user.height) - (5.677 * user.age) :
        447.593 + (9.247 * user.weight) + (3.098 * user.height) - (4.330 * user.age);

    const activityFactor = user.activityLevel === 'sedentary' ? 1.2 :
                           user.activityLevel === 'moderate' ? 1.55 : 1.725;

    return bmr * activityFactor;
}

function getMeals(category, user, calorieLimit) {
    const filteredFoods = foodItems.filter(food => 
        food.Category === category &&
        (!user.dietaryPreferences || food.DietaryPreferences.includes(user.dietaryPreferences)) &&
        (!user.allergies || !user.allergies.split(',').some(allergy => food.Allergens.includes(allergy)))
    );

    let selectedFoods = [];
    let totalCalories = 0;

    while (totalCalories < calorieLimit && filteredFoods.length > 0) {
        const food = filteredFoods[Math.floor(Math.random() * filteredFoods.length)];
        selectedFoods.push(food);
        totalCalories += parseFloat(food.Calories);
    }

    return selectedFoods;
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
