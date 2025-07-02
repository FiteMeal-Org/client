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

    console.log('� STEP 4: Return object created:', returnData);
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

// Function untuk mengecek exercise plan user
export const checkUserExercisePlan = async () => {
  console.log('🏋️ START: checkUserExercisePlan function called');
  console.log('🏋️ TIMESTAMP:', new Date().toISOString());

  try {
    const token = await SecureStore.getItemAsync('access_token');

    if (!token) {
      console.log('❌ No access token found for exercise plan');
      throw new Error('No access token found');
    }

    console.log('✅ Token found, making exercise plan API call...');
    const response = await fetch(`${BASE_URL}/api/excercise`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('📡 Exercise Plan API Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Exercise Plan API Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('📄 Exercise Plan API Response data:', result);

    // Debug the structure
    debugExercisePlanStructure(result);

    // Validate response structure
    if (!result || typeof result !== 'object') {
      console.log('❌ Invalid exercise plan response format:', result);
      throw new Error('Invalid exercise plan response format');
    }

    // Extract exercise plan data - adjust based on your API structure
    const data = result.data || result || {};
    console.log('🏋️ Raw exercise plan data structure:', data);

    // Handle different possible API response structures
    let allExercisePlans = [];
    let ongoingExercisePlans = [];
    let upcomingExercisePlans = [];

    if (Array.isArray(data)) {
      // If data is directly an array of plans
      allExercisePlans = data;
    } else if (data.ongoing || data.upcoming) {
      // If data has ongoing/upcoming structure
      ongoingExercisePlans = Array.isArray(data.ongoing) ? data.ongoing : [];
      upcomingExercisePlans = Array.isArray(data.upcoming) ? data.upcoming : [];
      allExercisePlans = [...ongoingExercisePlans, ...upcomingExercisePlans];
    } else {
      // If data is a single object or different structure
      allExercisePlans = [data].filter((plan) => plan && Object.keys(plan).length > 0);
    }

    // Filter ongoing plans (plans that are currently active)
    const today = new Date();
    ongoingExercisePlans = allExercisePlans.filter((plan: any) => {
      if (!plan?.startDate) return false;
      try {
        const startDate = new Date(plan.startDate);
        const endDate = plan.endDate
          ? new Date(plan.endDate)
          : new Date(startDate.getTime() + (plan.duration || 7) * 24 * 60 * 60 * 1000);

        return today >= startDate && today <= endDate;
      } catch (error) {
        console.log('❌ Error checking exercise plan dates:', error);
        return false;
      }
    });

    console.log('🏋️ Processed exercise plans:', {
      total: allExercisePlans.length,
      ongoing: ongoingExercisePlans.length,
      upcoming: upcomingExercisePlans.length,
    });

    const returnData = {
      hasExercisePlan: allExercisePlans.length > 0,
      exercisePlanCount: allExercisePlans.length,
      ongoingExercisePlans,
      upcomingExercisePlans,
      allExercisePlans,
    };

    console.log(
      '🏋️ Exercise Plan function - ABOUT TO RETURN:',
      JSON.stringify(returnData, null, 2)
    );
    return returnData;
  } catch (error) {
    console.error('❌ ERROR in checkUserExercisePlan:', error);

    const defaultReturn = {
      hasExercisePlan: false,
      exercisePlanCount: 0,
      ongoingExercisePlans: [],
      upcomingExercisePlans: [],
      allExercisePlans: [],
    };

    console.log('📊 Exercise Plan - Returning default data due to error:', defaultReturn);
    return defaultReturn;
  }
};

// PASTIKAN HANYA ADA SATU calculateTodayIntake function
export const calculateTodayIntake = (ongoingPlans: any[]) => {
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
  console.log('� Today date:', todayString);

  let totalIntakeCalories = 0;
  let targetCalories = 0;
  let completedMeals = 0;
  let totalMeals = 0;

  for (const plan of ongoingPlans) {
    if (!plan?.todoList || !Array.isArray(plan.todoList)) continue;

    const todayMeal = plan.todoList.find((day: any) => {
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

// Update exercise status - untuk struktur data baru
export const updateExerciseStatus = async (
  planId: string,
  day: number,
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
      isDone,
      notes,
    };

    console.log('📤 Updating exercise status:', body);
    console.log('🎯 Endpoint:', `${BASE_URL}/api/excercise/${planId}`);

    const response = await fetch(`${BASE_URL}/api/excercise/${planId}`, {
      method: 'PATCH',
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
    console.log('✅ Exercise status updated successfully:', result);

    return result;
  } catch (error) {
    console.error('❌ Error updating exercise status:', error);
    throw error;
  }
};

// Check user meal & exercise plans
export const checkUserMealExercisePlan = async () => {
  console.log('🔍 START: checkUserMealExercisePlan function called');

  try {
    const token = await SecureStore.getItemAsync('access_token');

    if (!token) {
      console.log('❌ No access token found');
      throw new Error('No access token found');
    }

    console.log('✅ Token found, making API call to meal-exercise endpoint...');
    const response = await fetch(`${BASE_URL}/api/add-meal-exercise`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('📡 Meal-Exercise API Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('📄 Meal-Exercise API Response data:', result);

    // Validate response structure
    if (!result || typeof result !== 'object') {
      console.log('❌ Invalid response format:', result);
      throw new Error('Invalid response format');
    }

    // Extract data
    const data = result.data || {};
    let plansData = [];

    if (Array.isArray(data)) {
      plansData = data;
    } else {
      // Handle structure with ongoing and upcoming arrays
      const ongoing = data.ongoing || [];
      const upcoming = data.upcoming || [];
      plansData = [...ongoing, ...upcoming];
    }

    console.log('📊 Processed meal-exercise plans data:', plansData);

    // Filter ongoing plans (same logic as meal plans)
    const ongoingPlans = plansData.filter((plan: any) => {
      if (!plan?.startDate) return false;

      const startDate = new Date(plan.startDate);
      const today = new Date();
      const diffTime = today.getTime() - startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays >= 1 && diffDays <= (plan.duration || 7);
    });

    console.log('📊 Ongoing meal-exercise plans:', ongoingPlans);

    return {
      hasMealExercisePlan: plansData.length > 0,
      mealExercisePlanCount: plansData.length,
      ongoingPlans: ongoingPlans,
      upcomingPlans: plansData.filter((plan: any) => {
        if (!plan?.startDate) return false;
        const startDate = new Date(plan.startDate);
        const today = new Date();
        return startDate > today;
      }),
      allPlans: plansData,
    };
  } catch (error) {
    console.error('❌ Error in checkUserMealExercisePlan:', error);
    return {
      hasMealExercisePlan: false,
      mealExercisePlanCount: 0,
      ongoingPlans: [],
      upcomingPlans: [],
      allPlans: [],
    };
  }
};

// Calculate today's intake from meal & exercise plans
export const calculateMealExerciseTodayIntake = (ongoingPlans: any[]) => {
  console.log('🔍 START: calculateMealExerciseTodayIntake with plans:', ongoingPlans);

  if (!Array.isArray(ongoingPlans) || ongoingPlans.length === 0) {
    console.log('❌ No ongoing meal-exercise plans provided');
    return {
      intakeCalories: 0,
      targetCalories: 0,
      intakePercentage: 0,
      remainingCalories: 0,
      completedMeals: 0,
      totalMeals: 0,
    };
  }

  // Get today's date
  const today = new Date();
  const todayDateStr = today.toISOString().split('T')[0];
  console.log('📅 Today date string:', todayDateStr);

  let totalIntakeCalories = 0;
  let totalTargetCalories = 0;
  let totalCompletedMeals = 0;
  let totalMeals = 0;

  ongoingPlans.forEach((plan, planIndex) => {
    console.log(`📋 Processing meal-exercise plan ${planIndex + 1}:`, plan.name || 'Unnamed plan');

    if (!plan.todoList || !Array.isArray(plan.todoList)) {
      console.log(`❌ Plan ${planIndex + 1} has no valid todoList`);
      return;
    }

    // Find today's data - try both date formats
    const todayData = plan.todoList.find((dayData: any) => {
      try {
        // Try different date formats
        let dayDateStr = '';
        if (dayData.date) {
          const dayDate = new Date(dayData.date);
          dayDateStr = dayDate.toISOString().split('T')[0];
        } else if (dayData.day) {
          // If day is a number, calculate from start date
          if (typeof dayData.day === 'number' && plan.startDate) {
            const startDate = new Date(plan.startDate);
            const targetDate = new Date(startDate);
            targetDate.setDate(startDate.getDate() + dayData.day - 1);
            dayDateStr = targetDate.toISOString().split('T')[0];
          } else {
            const dayDate = new Date(dayData.day);
            dayDateStr = dayDate.toISOString().split('T')[0];
          }
        }

        console.log(`📅 Comparing: ${dayDateStr} === ${todayDateStr}`);
        return dayDateStr === todayDateStr;
      } catch (error) {
        console.log(`❌ Error parsing date for day data:`, error);
        return false;
      }
    });

    if (!todayData) {
      console.log(`❌ No data found for today in plan ${planIndex + 1}`);
      console.log(
        `📋 Available days in plan:`,
        plan.todoList.map((d: any) => ({
          day: d.day,
          date: d.date,
        }))
      );
      return;
    }

    console.log(`📊 Today's data for plan ${planIndex + 1}:`, todayData);

    // Calculate meal calories - check for different meal types
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];
    mealTypes.forEach((mealType) => {
      const meal = todayData[mealType];
      if (meal && typeof meal === 'object') {
        totalMeals++;
        const calories = meal.calories || 0;
        totalTargetCalories += calories;

        if (meal.isDone) {
          totalCompletedMeals++;
          totalIntakeCalories += calories;
        }

        console.log(`📊 ${mealType}: ${calories} cal, completed: ${meal.isDone}`);
      }
    });

    // Add daily calories if available (this might be the total daily target)
    if (todayData.dailyCalories && typeof todayData.dailyCalories === 'number') {
      // Don't add to totalTargetCalories if we already counted individual meals
      // Instead, use this as the main target if no individual meal calories
      if (totalTargetCalories === 0) {
        totalTargetCalories = todayData.dailyCalories;
      }
      console.log('📊 Daily calories from plan:', todayData.dailyCalories);
    }
  });

  const intakePercentage =
    totalTargetCalories > 0 ? (totalIntakeCalories / totalTargetCalories) * 100 : 0;
  const remainingCalories = totalTargetCalories - totalIntakeCalories;

  const result = {
    intakeCalories: totalIntakeCalories,
    targetCalories: totalTargetCalories,
    intakePercentage: Math.round(intakePercentage),
    remainingCalories: Math.max(0, remainingCalories),
    completedMeals: totalCompletedMeals,
    totalMeals: totalMeals,
  };

  console.log('📊 Final meal-exercise calorie calculation:', result);
  return result;
};

// Helper function to safely get exercise data handling key variations
const safeGetExerciseData = (dayData: any) => {
  if (!dayData) return null;

  // Handle different possible structures
  const exercise = dayData.exercise || dayData.exercises || dayData;

  if (!exercise) return null;

  // Handle array of exercises vs single exercise
  if (Array.isArray(exercise)) {
    // If it's an array, take the first exercise or calculate total
    const totalCalories = exercise.reduce((sum: number, ex: any) => {
      const calories = ex?.caloriesBurned || ex?.calories || 0;
      return sum + (typeof calories === 'number' ? calories : 0);
    }, 0);

    const anyDone = exercise.some((ex: any) => ex?.isDone || ex?.completed);

    return {
      caloriesBurned: totalCalories,
      isDone: anyDone,
      exerciseName:
        exercise[0]?.exerciseName ||
        exercise[0]?.excerciseName ||
        exercise[0]?.name ||
        'Unknown Exercise',
    };
  }

  // Handle single exercise object with robust key checking
  const caloriesBurned = exercise.caloriesBurned || exercise.calories || 0;
  const isDone = exercise.isDone || exercise.completed || dayData.isDone || false;
  const exerciseName =
    exercise.exerciseName || exercise.excerciseName || exercise.name || 'Unknown Exercise';

  return {
    caloriesBurned: typeof caloriesBurned === 'number' ? caloriesBurned : 0,
    isDone,
    exerciseName,
  };
};

// Calculate total burned calories from exercise plans - Updated for robust key handling
export const calculateTodayExerciseBurn = (ongoingExercisePlans: any[]) => {
  console.log('🏋️ START: calculateTodayExerciseBurn with plans:', ongoingExercisePlans);

  if (!Array.isArray(ongoingExercisePlans) || ongoingExercisePlans.length === 0) {
    console.log('❌ No ongoing exercise plans provided');
    return {
      burnedCalories: 0,
      targetBurnCalories: 0,
      burnPercentage: 0,
      remainingBurnCalories: 0,
      completedExercises: 0,
      totalExercises: 0,
    };
  }

  let totalBurnedCalories = 0;
  let targetBurnCalories = 0;
  let completedExercises = 0;
  let totalExercises = 0;

  for (let planIndex = 0; planIndex < ongoingExercisePlans.length; planIndex++) {
    const plan = ongoingExercisePlans[planIndex];
    console.log(`🏋️ Processing exercise plan ${planIndex + 1}:`, {
      id: plan?._id || plan?.id,
      name: plan?.name,
      hasTodoList: !!plan?.todoList,
      todoListLength: plan?.todoList?.length,
    });

    if (!plan?.todoList || !Array.isArray(plan.todoList)) {
      console.log(`❌ Plan ${planIndex + 1}: No todoList found in exercise plan`);
      continue;
    }

    // Process each day in the exercise plan
    plan.todoList.forEach((dayData: any, dayIndex: number) => {
      try {
        const exerciseData = safeGetExerciseData(dayData);

        if (!exerciseData) {
          console.log(
            `⚠️ Plan ${planIndex + 1}, Day ${dayIndex + 1}: No valid exercise data found`
          );
          return;
        }

        const { caloriesBurned, isDone, exerciseName } = exerciseData;

        // Add to target calories (all days contribute to target)
        if (caloriesBurned > 0) {
          targetBurnCalories += caloriesBurned;
          totalExercises++;
          console.log(
            `🎯 Plan ${planIndex + 1}, Day ${dayIndex + 1} (${exerciseName}): Target = ${caloriesBurned} calories`
          );
        }

        // Add to burned calories only if completed
        if (isDone && caloriesBurned > 0) {
          totalBurnedCalories += caloriesBurned;
          completedExercises++;
          console.log(
            `✅ Plan ${planIndex + 1}, Day ${dayIndex + 1} (${exerciseName}): Completed = ${caloriesBurned} calories`
          );
        }
      } catch (error) {
        console.error(`❌ Error processing day ${dayIndex + 1} in plan ${planIndex + 1}:`, error);
        console.log('❌ Day data that caused error:', dayData);
      }
    });
  }

  const burnPercentage =
    targetBurnCalories > 0 ? Math.round((totalBurnedCalories / targetBurnCalories) * 100) : 0;
  const remainingBurnCalories = Math.max(0, targetBurnCalories - totalBurnedCalories);

  const result = {
    burnedCalories: totalBurnedCalories,
    targetBurnCalories,
    burnPercentage,
    remainingBurnCalories,
    completedExercises,
    totalExercises,
  };

  console.log('📊 calculateTodayExerciseBurn final result:', result);
  return result;
};

// Debug function to log exercise plan structure
export const debugExercisePlanStructure = (data: any) => {
  console.log('🔍 DEBUG: Exercise Plan Raw Data Structure:');
  console.log('🔍 Type:', typeof data);
  console.log('🔍 Is Array:', Array.isArray(data));

  if (data) {
    console.log('🔍 Keys:', Object.keys(data));
    console.log('🔍 Full Structure:', JSON.stringify(data, null, 2));

    // Check for different possible structures
    if (data.data) {
      console.log('🔍 data.data structure:', JSON.stringify(data.data, null, 2));
    }

    if (data.ongoing) {
      console.log('🔍 data.ongoing structure:', JSON.stringify(data.ongoing, null, 2));
    }

    if (Array.isArray(data)) {
      console.log('🔍 Array length:', data.length);
      data.forEach((plan: any, index: number) => {
        console.log(`🔍 Plan ${index + 1}:`, {
          id: plan._id || plan.id,
          name: plan.name,
          startDate: plan.startDate,
          hasTodoList: !!plan.todoList,
          todoListLength: plan.todoList?.length,
        });

        if (plan.todoList && Array.isArray(plan.todoList)) {
          plan.todoList.forEach((day: any, dayIndex: number) => {
            console.log(`🔍   Day ${dayIndex + 1}:`, {
              date: day.date,
              day: day.day,
              isDone: day.isDone,
              exercisesCount: day.exercises?.length || 0,
            });
          });
        }
      });
    }
  }
};

// Calculate exercise burn from meal & exercise plans - Day-level completion tracking
export const calculateMealExerciseBurn = (ongoingPlans: any[]) => {
  console.log('🏋️‍♀️ START: calculateMealExerciseBurn with meal-exercise plans:', ongoingPlans);

  if (!Array.isArray(ongoingPlans) || ongoingPlans.length === 0) {
    console.log('❌ No ongoing meal-exercise plans provided');
    return {
      burnedCalories: 0,
      targetBurnCalories: 0,
      burnPercentage: 0,
      remainingBurnCalories: 0,
      completedExercises: 0,
      totalExercises: 0,
    };
  }

  let totalBurnedCalories = 0;
  let targetBurnCalories = 0;
  let completedExercises = 0;
  let totalExercises = 0;

  for (let planIndex = 0; planIndex < ongoingPlans.length; planIndex++) {
    const plan = ongoingPlans[planIndex];
    console.log(`🏋️‍♀️ Processing meal-exercise plan ${planIndex + 1}:`, {
      id: plan?._id || plan?.id,
      name: plan?.name,
      hasTodoList: !!plan?.todoList,
      todoListLength: plan?.todoList?.length,
    });

    if (!plan?.todoList || !Array.isArray(plan.todoList)) {
      console.log(`❌ Plan ${planIndex + 1}: No todoList found in meal-exercise plan`);
      continue;
    }

    // Process each day in the meal-exercise plan
    plan.todoList.forEach((dayData: any, dayIndex: number) => {
      try {
        // In meal-exercise plans, exercise data is directly under dayData.exercise
        const exercise = dayData.exercise;

        if (!exercise) {
          console.log(`⚠️ Plan ${planIndex + 1}, Day ${dayIndex + 1}: No exercise data found`);
          return;
        }

        // Get exercise calories burned and completion status
        const caloriesBurned = exercise.caloriesBurned || 0;
        const isDone = exercise.isDone || false;
        const exerciseName = exercise.exerciseName || exercise.excerciseName || 'Unknown Exercise';

        // Add to target calories (all days contribute to target)
        if (caloriesBurned > 0) {
          targetBurnCalories += caloriesBurned;
          totalExercises++;
          console.log(
            `🎯 Plan ${planIndex + 1}, Day ${dayIndex + 1} (${exerciseName}): Target = ${caloriesBurned} calories`
          );
        }

        // Add to burned calories only if day is marked as completed
        if (isDone && caloriesBurned > 0) {
          totalBurnedCalories += caloriesBurned;
          completedExercises++;
          console.log(
            `✅ Plan ${planIndex + 1}, Day ${dayIndex + 1} (${exerciseName}): Completed = ${caloriesBurned} calories`
          );
        }
      } catch (error) {
        console.error(
          `❌ Error processing day ${dayIndex + 1} in meal-exercise plan ${planIndex + 1}:`,
          error
        );
        console.log('❌ Day data that caused error:', dayData);
      }
    });
  }

  const burnPercentage =
    targetBurnCalories > 0 ? Math.round((totalBurnedCalories / targetBurnCalories) * 100) : 0;
  const remainingBurnCalories = Math.max(0, targetBurnCalories - totalBurnedCalories);

  const result = {
    burnedCalories: totalBurnedCalories,
    targetBurnCalories,
    burnPercentage,
    remainingBurnCalories,
    completedExercises,
    totalExercises,
  };

  console.log('📊 calculateMealExerciseBurn final result:', result);
  return result;
};

// Update exercise status for meal & exercise plans - Day-level completion
export const updateMealExerciseStatus = async (
  planId: string,
  day: number,
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
      isDone,
      notes,
      planType: 'exercise', // Required field for API
    };

    console.log('📤 Updating meal-exercise status:', body);
    console.log('🎯 Endpoint:', `${BASE_URL}/api/add-meal-exercise/${planId}`);

    const response = await fetch(`${BASE_URL}/api/add-meal-exercise/${planId}`, {
      method: 'PATCH',
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
    console.log('✅ Meal-exercise status updated successfully:', result);

    return result;
  } catch (error) {
    console.error('❌ Error updating meal-exercise status:', error);
    throw error;
  }
};

// Function untuk menghitung kalori bakar dari exercise plan standalone
export const calculateExercisePlanBurn = (ongoingExercisePlans: any[]) => {
  console.log(
    '🏋️ START: calculateExercisePlanBurn with standalone exercise plans:',
    ongoingExercisePlans
  );

  if (!Array.isArray(ongoingExercisePlans) || ongoingExercisePlans.length === 0) {
    console.log('❌ No ongoing exercise plans provided');
    return {
      burnedCalories: 0,
      targetBurnCalories: 0,
      burnPercentage: 0,
      remainingBurnCalories: 0,
      completedExercises: 0,
      totalExercises: 0,
    };
  }

  let totalBurnedCalories = 0;
  let targetBurnCalories = 0;
  let completedExercises = 0;
  let totalExercises = 0;

  const today = new Date();
  const todayDateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format

  for (let planIndex = 0; planIndex < ongoingExercisePlans.length; planIndex++) {
    const plan = ongoingExercisePlans[planIndex];
    console.log(`🏋️ Processing exercise plan ${planIndex + 1}:`, {
      id: plan?._id || plan?.id,
      name: plan?.name,
      hasTodoList: !!plan?.todoList,
      todoListLength: plan?.todoList?.length,
    });

    if (!plan?.todoList || !Array.isArray(plan.todoList)) {
      console.log(`❌ Plan ${planIndex + 1}: No todoList found in exercise plan`);
      continue;
    }

    // Find today's exercise in the todoList
    const todayExercise = plan.todoList.find((dayData: any) => {
      if (!dayData.date) return false;
      const exerciseDate = new Date(dayData.date).toISOString().split('T')[0];
      return exerciseDate === todayDateString;
    });

    if (todayExercise) {
      console.log(`🏋️ Plan ${planIndex + 1}: Found today's exercise:`, {
        day: todayExercise.day,
        exerciseName: todayExercise.exerciseName || todayExercise.excerciseName,
        caloriesBurned: todayExercise.caloriesBurned,
        isDone: todayExercise.isDone,
      });

      totalExercises++;

      if (todayExercise.isDone) {
        completedExercises++;
        const caloriesBurned = todayExercise.caloriesBurned || 0;
        totalBurnedCalories += caloriesBurned;
        console.log(
          `✅ Plan ${planIndex + 1}: Today's exercise completed, burned ${caloriesBurned} calories`
        );
      } else {
        console.log(`⏳ Plan ${planIndex + 1}: Today's exercise not completed yet`);
      }

      // Add to target (today's exercise should be completed)
      const targetCalories = todayExercise.caloriesBurned || 0;
      targetBurnCalories += targetCalories;
    } else {
      console.log(`⚠️ Plan ${planIndex + 1}: No exercise scheduled for today`);
    }
  }

  const burnPercentage =
    targetBurnCalories > 0 ? Math.round((totalBurnedCalories / targetBurnCalories) * 100) : 0;
  const remainingBurnCalories = Math.max(0, targetBurnCalories - totalBurnedCalories);

  const result = {
    burnedCalories: totalBurnedCalories,
    targetBurnCalories,
    burnPercentage,
    remainingBurnCalories,
    completedExercises,
    totalExercises,
  };

  console.log('📊 calculateExercisePlanBurn final result:', result);
  return result;
};
