// Test file untuk memverifikasi logika kalori dari meal & exercise plan
import { calculateMealExerciseTodayIntake } from '../services/mealPlanService';

// Mock data meal & exercise plan
const mockMealExercisePlan = [
  {
    _id: "test123",
    name: "Test Meal & Exercise Plan",
    startDate: new Date().toISOString(),
    duration: 7,
    todoList: [
      {
        day: 1,
        date: new Date().toISOString(), // Today
        breakfast: {
          calories: 400,
          isDone: true,
          description: "Oatmeal with fruits"
        },
        lunch: {
          calories: 600,
          isDone: false,
          description: "Grilled chicken salad"
        },
        dinner: {
          calories: 500,
          isDone: false,
          description: "Salmon with vegetables"
        },
        dailyCalories: 1500
      }
    ]
  }
];

// Test fungsi
console.log('🧪 Testing calculateMealExerciseTodayIntake...');
const result = calculateMealExerciseTodayIntake(mockMealExercisePlan);
console.log('📊 Test result:', result);

// Expected result:
// - intakeCalories: 400 (only breakfast is done)
// - targetCalories: 1500 (or 1500 from individual meals)
// - completedMeals: 1
// - totalMeals: 3
