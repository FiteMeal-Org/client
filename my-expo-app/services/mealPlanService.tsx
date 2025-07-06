import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://api-fitemeal.vercel.app';

// HAPUS SEMUA function checkUserMealPlan yang lama!
// PASTIKAN HANYA ADA SATU function ini di file

export const checkUserMealPlan = async () => {
  console.log('🔍 START: NEW checkUserMealPlan function called');
  console.log('🔍 TIMESTAMP:', new Date().toISOString());

  try {
    const token = await SecureStore.getItemAsync('access_token');

    if (!token) {
      console.log('❌ No access token found');
      throw new Error('No access token found');
    }

    console.log('✅ Token found, making API call...');
    const response = await fetch(`${BASE_URL}/api/add-prepmeal`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('📡 API Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('📄 NEW FUNCTION - API Response data:', result);

    // STEP 1: Validate response structure
    console.log('🔍 STEP 1: Validating response structure...');
    if (!result || typeof result !== 'object') {
      console.log('❌ Invalid response format:', result);
      throw new Error('Invalid response format');
    }
    console.log('✅ STEP 1: Response format valid');

    // STEP 2: Extract data object
    console.log('🔍 STEP 2: Extracting data object...');
    const data = result.data || {};
    console.log('📄 STEP 2: Extracted data object:', data);

    // STEP 3: Extract ongoing and upcoming arrays
    console.log('🔍 STEP 3: Extracting ongoing and upcoming arrays...');
    const ongoing = Array.isArray(data.ongoing) ? data.ongoing : [];
    const upcoming = Array.isArray(data.upcoming) ? data.upcoming : [];

    console.log('📄 STEP 3: Processed ongoing length:', ongoing.length);
    console.log('📄 STEP 3: Processed upcoming length:', upcoming.length);

    // STEP 4: Create return object
    console.log('🔍 STEP 4: Creating return object...');
    const returnData = {
      hasMealPlan: ongoing.length + upcoming.length > 0,
      mealPlanCount: ongoing.length + upcoming.length,
      ongoingPlans: ongoing,
      upcomingPlans: upcoming,
      allPlans: [...ongoing, ...upcoming],
    };

    console.log('📄 STEP 4: Return object created:', returnData);
    console.log('🚀 NEW FUNCTION - ABOUT TO RETURN:', JSON.stringify(returnData, null, 2));

    return returnData;
  } catch (error) {
    console.error('❌ ERROR in NEW checkUserMealPlan:', error);

    const defaultReturn = {
      hasMealPlan: false,
      mealPlanCount: 0,
      ongoingPlans: [],
      upcomingPlans: [],
      allPlans: [],
    };

    console.log('📊 NEW FUNCTION - Returning default data due to error:', defaultReturn);
    return defaultReturn;
  }
};

// PASTIKAN HANYA ADA SATU calculateTodayIntake function
export const calculateTodayIntake = (ongoingPlans) => {
  console.log('🧮 NEW calculateTodayIntake called');
  console.log('🧮 Input ongoing plans:', ongoingPlans?.length);

  if (!Array.isArray(ongoingPlans) || ongoingPlans.length === 0) {
    console.log('❌ No ongoing plans or invalid format');
    return {
      intakeCalories: 0,
      targetCalories: 0,
      intakePercentage: 0,
      remainingCalories: 0,
      completedMeals: 0,
      totalMeals: 0,
    };
  }

  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  console.log('📅 Today date:', todayString);

  let totalIntakeCalories = 0;
  let targetCalories = 0;
  let completedMeals = 0;
  let totalMeals = 0;

  for (const plan of ongoingPlans) {
    if (!plan?.todoList || !Array.isArray(plan.todoList)) continue;

    const todayMeal = plan.todoList.find((day) => {
      if (!day?.date) return false;
      try {
        const dayDate = new Date(day.date).toISOString().split('T')[0];
        return dayDate === todayString;
      } catch {
        return false;
      }
    });

    if (todayMeal) {
      console.log('🍽️ Found today meal plan');
      targetCalories = todayMeal.dailyCalories || 0;

      ['breakfast', 'lunch', 'dinner'].forEach((mealType) => {
        const meal = todayMeal[mealType];
        if (meal && typeof meal === 'object') {
          totalMeals++;
          if (meal.isDone) {
            totalIntakeCalories += meal.calories || 0;
            completedMeals++;
          }
        }
      });
      break;
    }
  }

  const intakePercentage =
    targetCalories > 0 ? Math.round((totalIntakeCalories / targetCalories) * 100) : 0;
  const remainingCalories = Math.max(0, targetCalories - totalIntakeCalories);

  const result = {
    intakeCalories: totalIntakeCalories,
    targetCalories,
    intakePercentage,
    remainingCalories,
    completedMeals,
    totalMeals,
  };

  console.log('📊 NEW calculateTodayIntake result:', result);
  return result;
};

// Tambahkan function baru untuk update meal status
export const updateMealStatus = async (
  planId: string,
  day: number,
  type: 'breakfast' | 'lunch' | 'dinner',
  isDone: boolean,
  notes: string = ''
) => {
  try {
    const token = await SecureStore.getItemAsync('access_token');

    if (!token) {
      throw new Error('No access token found');
    }

    const body = {
      day,
      type,
      isDone,
      notes,
    };

    console.log('📤 Updating meal status:', body);
    console.log('🎯 Endpoint:', `${BASE_URL}/api/add-prepmeal/${planId}`);

    const response = await fetch(`${BASE_URL}/api/add-prepmeal/${planId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Meal status updated successfully:', result);

    return result;
  } catch (error) {
    console.error('❌ Error updating meal status:', error);
    throw error;
  }
};
