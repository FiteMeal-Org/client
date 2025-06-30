import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';

export const checkUserMealPlan = async (): Promise<{
  hasMealPlan: boolean;
  mealPlanCount: number;
}> => {
  try {
    console.log('🔍 Checking user meal plan...');
    const token = await SecureStore.getItemAsync('access_token');

    if (!token) {
      console.log('❌ No token found');
      return { hasMealPlan: false, mealPlanCount: 0 };
    }

    console.log('✅ Token found, making API call...');
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PREP_MEAL}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('📡 API Response status:', response.status);

    if (!response.ok) {
      console.log('❌ API call failed:', response.status);
      return { hasMealPlan: false, mealPlanCount: 0 };
    }

    const result = await response.json();
    console.log('📄 API Response data:', result);

    const mealPlanCount = result.data?.length || 0;
    console.log('📊 Meal plan count:', mealPlanCount);

    const hasMealPlan = mealPlanCount > 0;
    console.log('✅ Has meal plan:', hasMealPlan);

    return {
      hasMealPlan: hasMealPlan,
      mealPlanCount: mealPlanCount,
    };
  } catch (error) {
    console.error('💥 Error checking meal plan:', error);
    return { hasMealPlan: false, mealPlanCount: 0 };
  }
};
