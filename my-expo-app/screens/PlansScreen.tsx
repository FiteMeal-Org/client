import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_CONFIG } from '../config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_URL = 'https://api-fitemeal.vercel.app';

// Interface untuk uploaded meal data
interface UploadedMealData {
  name: string;
  calories: number;
  ingredients: string[];
  recipes: string[];
  isDone: boolean;
  notes: string;
  imageUrl: string;
}

// Interface untuk uploaded day data
interface UploadedDayData {
  day: number;
  date: string;
  dailycalories: number;
  breakfast: UploadedMealData;
  lunch: UploadedMealData;
  dinner: UploadedMealData;
}

// Interface untuk uploaded plan data
interface UploadedPlanData {
  _id: string;
  notes: string;
  userId: string;
  startDate: string;
  endDate: string;
  photoUrl: string;
  todoList: UploadedDayData[];
  plansId: string;
  createdAt: string;
  updatedAt: string;
}

// Interface untuk meal data
interface MealData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isDone: boolean;
  notes?: string;
  ingredients?: string[];
  recipes?: string[];
}

// Interface untuk day data
interface DayData {
  date: string;
  day: number;
  dailyCalories: number;
  breakfast: MealData;
  lunch: MealData;
  dinner: MealData;
}

// Interface untuk plan data
interface PlanData {
  _id: string;
  name: string;
  description: string;
  duration: number;
  startDate: string;
  endDate: string;
  todoList: DayData[];
}

export default function PlansScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [ongoingPlans, setOngoingPlans] = useState<PlanData[]>([]);
  const [upcomingPlans, setUpcomingPlans] = useState<PlanData[]>([]);
  const [activeTab, setActiveTab] = useState<'ongoing' | 'upcoming'>('ongoing');
  const [mealNotes, setMealNotes] = useState<{ [key: string]: string }>({});
  const [updatingMeal, setUpdatingMeal] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'original' | 'alternate' | 'upload'>('original');
  const [uploadedPlans, setUploadedPlans] = useState<UploadedPlanData[]>([]);
  const [uploadedPlansLoading, setUploadedPlansLoading] = useState(false);
  const [alternatePlans, setAlternatePlans] = useState<{ [key: string]: PlanData[] }>({});
  const [alternateLoading, setAlternateLoading] = useState(false);
  const [alternateGenerated, setAlternateGenerated] = useState<{ [key: string]: boolean }>({});

  // Update meal completion status
  const updateMealStatus = useCallback(
    async (planId: string, day: number, type: string, isDone: boolean, notes: string) => {
      try {
        setUpdatingMeal(`${day}-${type}`);

        const token = await SecureStore.getItemAsync('access_token');
        if (!token) {
          Alert.alert('Error', 'No access token found');
          throw new Error('No access token found');
        }

        const body = {
          day,
          type,
          isDone,
          notes,
        };

        console.log('Sending request to:', `${BASE_URL}/api/add-prepmeal/${planId}`);
        console.log('Request body:', body);

        const response = await fetch(`${BASE_URL}/api/add-prepmeal/${planId}`, {
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
        console.log('✅ Update successful:', result);

        // Update local state
        setPlans((prevPlans) =>
          prevPlans.map((plan) => {
            if (plan._id === planId) {
              return {
                ...plan,
                todoList: plan.todoList.map((dayData) => {
                  if (dayData.day === day) {
                    return {
                      ...dayData,
                      [type]: {
                        ...dayData[type as keyof Omit<DayData, 'date' | 'day' | 'dailyCalories'>],
                        isDone,
                        notes,
                      },
                    };
                  }
                  return dayData;
                }),
              };
            }
            return plan;
          })
        );

        setOngoingPlans((prevPlans) =>
          prevPlans.map((plan) => {
            if (plan._id === planId) {
              return {
                ...plan,
                todoList: plan.todoList.map((dayData) => {
                  if (dayData.day === day) {
                    return {
                      ...dayData,
                      [type]: {
                        ...dayData[type as keyof Omit<DayData, 'date' | 'day' | 'dailyCalories'>],
                        isDone,
                        notes,
                      },
                    };
                  }
                  return dayData;
                }),
              };
            }
            return plan;
          })
        );

        setUpcomingPlans((prevPlans) =>
          prevPlans.map((plan) => {
            if (plan._id === planId) {
              return {
                ...plan,
                todoList: plan.todoList.map((dayData) => {
                  if (dayData.day === day) {
                    return {
                      ...dayData,
                      [type]: {
                        ...dayData[type as keyof Omit<DayData, 'date' | 'day' | 'dailyCalories'>],
                        isDone,
                        notes,
                      },
                    };
                  }
                  return dayData;
                }),
              };
            }
            return plan;
          })
        );

        // Clear notes input after successful update
        const noteKey = `${selectedPlan}-${day}-${type}`;
        setMealNotes((prev) => ({
          ...prev,
          [noteKey]: '',
        }));

        Alert.alert(
          'Success',
          `${type.charAt(0).toUpperCase() + type.slice(1)} marked as ${isDone ? 'completed' : 'incomplete'}!`
        );
      } catch (error) {
        console.error('❌ Error updating meal status:', error);
        Alert.alert('Error', 'Failed to update meal status. Please try again.');
      } finally {
        setUpdatingMeal(null);
      }
    },
    [selectedPlan]
  );

  // Fetch meal plans
  const fetchMealPlans = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');

      if (!token) {
        Alert.alert('Error', 'No access token found');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/add-prepmeal`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📄 Meal Plans API Response:', JSON.stringify(result, null, 2));

      const ongoing = Array.isArray(result.data?.ongoing) ? result.data.ongoing : [];
      const upcoming = Array.isArray(result.data?.upcoming) ? result.data.upcoming : [];

      // Log meal data structure to debug ingredients/recipe issue
      if (ongoing.length > 0 && ongoing[0].todoList && ongoing[0].todoList.length > 0) {
        console.log('📄 Sample meal data:', JSON.stringify(ongoing[0].todoList[0], null, 2));
      }

      setOngoingPlans(ongoing);
      setUpcomingPlans(upcoming);
      setPlans([...ongoing, ...upcoming]);

      // Remove automatic plan selection - let user choose manually
      // if (!selectedPlan && ongoing.length > 0) {
      //   setSelectedPlan(ongoing[0]._id);
      // }
    } catch (error) {
      console.error('❌ Error fetching meal plans:', error);
      Alert.alert('Error', 'Failed to fetch meal plans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPlan]);

  // Fetch uploaded meal plans - filtered by selected plan
  const fetchUploadedPlans = useCallback(async (planId?: string) => {
    try {
      setUploadedPlansLoading(true);
      const token = await SecureStore.getItemAsync('access_token');

      if (!token) {
        console.log('❌ No access token found for uploaded plans');
        return;
      }

      const targetPlanId = planId || selectedPlan;
      console.log('🔍 Fetching uploaded plans for planId:', targetPlanId);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD_GET}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📄 Uploaded Plans API Response:', JSON.stringify(result, null, 2));

      const uploadedData = Array.isArray(result.data) ? result.data : [];
      
      // Filter uploaded plans by current selected plan ID
      const filteredUploadedPlans = uploadedData.filter((plan: any) => 
        plan.plansId === targetPlanId || plan.planId === targetPlanId
      );

      console.log('🔍 Total uploaded plans from API:', uploadedData.length);
      console.log('🔍 Filtered uploaded plans for current plan:', filteredUploadedPlans.length);
      console.log('🔍 Plan IDs in uploaded data:', uploadedData.map((p: any) => ({ id: p._id, plansId: p.plansId, planId: p.planId })));

      setUploadedPlans(filteredUploadedPlans);

      console.log('✅ Uploaded plans loaded for plan:', targetPlanId, '- Count:', filteredUploadedPlans.length);
    } catch (error) {
      console.error('❌ Error fetching uploaded plans:', error);
      Alert.alert('Error', 'Failed to fetch uploaded meal plans');
    } finally {
      setUploadedPlansLoading(false);
    }
  }, [selectedPlan]);

  // Save alternate plans to storage
  const saveAlternatePlansToStorage = useCallback(async (plans: { [key: string]: PlanData[] }, generated: { [key: string]: boolean }) => {
    try {
      await SecureStore.setItemAsync('alternate_plans', JSON.stringify(plans));
      await SecureStore.setItemAsync('alternate_generated', JSON.stringify(generated));
      console.log('✅ Saved alternate plans to storage');
    } catch (error) {
      console.error('❌ Error saving alternate plans to storage:', error);
    }
  }, []);

  // Fetch alternate meal plans (grocery list)
  const generateAlternatePlan = useCallback(async (planId: string) => {
    try {
      setAlternateLoading(true);
      const token = await SecureStore.getItemAsync('access_token');

      if (!token) {
        Alert.alert('Error', 'No access token found');
        return;
      }

      // Try different request body formats
      const requestBody1 = { planId: planId };
      const requestBody2 = { id: planId };
      
      console.log('🔍 Generating alternate plan for planId:', planId);
      console.log('🔍 Plan object from current plans:', currentPlan);
      console.log('📡 Trying request body format 1:', requestBody1);
      
      let response = await fetch(`${BASE_URL}/api/grocerylist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody1),
      });

      console.log('📡 Response status for format 1:', response.status);

      // If first format fails with 500, try second format
      if (!response.ok && response.status === 500) {
        console.log('📡 Trying request body format 2:', requestBody2);
        response = await fetch(`${BASE_URL}/api/grocerylist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody2),
        });
        console.log('📡 Response status for format 2:', response.status);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        console.error('❌ API Error Status:', response.status);
        console.error('❌ API Error Headers:', response.headers);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📄 Alternate Plan API Response:', JSON.stringify(result, null, 2));

      // Handle response structure - API returns { result: { ... } }
      const alternateData = result.result || result.data || result;
      
      if (alternateData && alternateData.todoList && Array.isArray(alternateData.todoList)) {
        // Convert the API response to match our PlanData interface
        const planStructure: PlanData = {
          _id: alternateData._id || planId,
          name: alternateData.name || 'Alternate Meal Plan',
          description: 'Generated alternate meal plan based on grocery list',
          duration: alternateData.todoList.length,
          startDate: alternateData.startDate || new Date().toISOString(),
          endDate: alternateData.endDate || new Date(Date.now() + alternateData.todoList.length * 24 * 60 * 60 * 1000).toISOString(),
          todoList: alternateData.todoList
        };
        
        const newAlternatePlans = {
          ...alternatePlans,
          [planId]: [planStructure]
        };
        const newAlternateGenerated = {
          ...alternateGenerated,
          [planId]: true
        };
        
        setAlternatePlans(newAlternatePlans);
        setAlternateGenerated(newAlternateGenerated);
        
        // Save to storage for persistence
        await saveAlternatePlansToStorage(newAlternatePlans, newAlternateGenerated);
        
        console.log('✅ Alternate plan generated successfully:', planStructure.name);
      } else {
        console.log('❌ Invalid alternate plan data structure:', alternateData);
        Alert.alert('Error', 'Invalid response structure from server');
      }
    } catch (error) {
      console.error('❌ Error generating alternate plan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate alternate meal plan';
      
      // Show detailed error to user
      Alert.alert(
        'Error Generating Alternate Plan', 
        `${errorMessage}\n\nThis might be due to:\n• Server is temporarily unavailable\n• Invalid plan data\n• Network connection issues\n\nPlease try again later.`,
        [
          { text: 'OK', style: 'default' },
          { 
            text: 'Retry', 
            onPress: () => generateAlternatePlan(planId),
            style: 'default'
          }
        ]
      );
    } finally {
      setAlternateLoading(false);
    }
  }, [alternatePlans, alternateGenerated, saveAlternatePlansToStorage]);

  useEffect(() => {
    fetchMealPlans();
    loadPersistedAlternatePlans(); // Load persisted alternate plans
  }, [fetchMealPlans]);

  // Load persisted alternate plans from storage
  const loadPersistedAlternatePlans = useCallback(async () => {
    try {
      const storedAlternatePlans = await SecureStore.getItemAsync('alternate_plans');
      const storedAlternateGenerated = await SecureStore.getItemAsync('alternate_generated');
      
      if (storedAlternatePlans) {
        const parsedPlans = JSON.parse(storedAlternatePlans);
        setAlternatePlans(parsedPlans);
        console.log('✅ Loaded persisted alternate plans:', Object.keys(parsedPlans).length, 'plans');
      }
      
      if (storedAlternateGenerated) {
        const parsedGenerated = JSON.parse(storedAlternateGenerated);
        setAlternateGenerated(parsedGenerated);
        console.log('✅ Loaded persisted alternate generated state:', Object.keys(parsedGenerated).length, 'entries');
      }
    } catch (error) {
      console.error('❌ Error loading persisted alternate plans:', error);
    }
  }, []);

  // Handle route params for navigation from upload
  useEffect(() => {
    const params = route.params as any;
    if (params?.viewMode === 'upload' && params?.planId) {
      console.log('📋 Navigated from upload with params:', params);
      setSelectedPlan(params.planId);
      setViewMode('upload');
      // Fetch uploaded plans when coming from upload
      fetchUploadedPlans(params.planId);
    }
  }, [route.params, fetchUploadedPlans]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMealPlans();
  }, [fetchMealPlans]);

  const currentPlan = plans.find((plan) => plan._id === selectedPlan);
  const currentDay = currentPlan?.todoList.find((day) => day.day === selectedDay);

  // Handle view mode change
  const handleViewModeChange = (mode: 'original' | 'alternate' | 'upload') => {
    setViewMode(mode);

    // Fetch uploaded plans when switching to upload mode
    if (mode === 'upload' && selectedPlan) {
      fetchUploadedPlans(selectedPlan);
    }
  };

  // Handle plan selection
  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setSelectedDay(1);
    setViewMode('original'); // Reset to original view when selecting a new plan
    // Don't reset alternate plans - keep them for each plan
    setUploadedPlans([]); // Clear uploaded plans when switching plans
  };

  // Handle tab switching and clear selected plan
  const handleTabSwitch = (tab: 'ongoing' | 'upcoming') => {
    setActiveTab(tab);
    setSelectedPlan(null); // Clear selected plan when switching tabs
    setSelectedDay(1);
    setViewMode('original'); // Reset view mode
    setUploadedPlans([]); // Clear uploaded plans when switching tabs
  };

  // Handle meal completion toggle
  const handleMealToggle = async (mealType: string) => {
    if (!selectedPlan || !currentDay) return;

    const meal = currentDay[
      mealType as keyof Omit<DayData, 'date' | 'day' | 'dailyCalories'>
    ] as MealData;
    const noteKey = `${selectedPlan}-${selectedDay}-${mealType}`;
    const notes = mealNotes[noteKey] || meal.notes || '';

    await updateMealStatus(selectedPlan, selectedDay, mealType, !meal.isDone, notes);
  };

  // Get notes for a specific meal
  const getMealNotes = (mealType: string) => {
    const noteKey = `${selectedPlan}-${selectedDay}-${mealType}`;
    return (
      mealNotes[noteKey] ||
      currentDay?.[mealType as keyof Omit<DayData, 'date' | 'day' | 'dailyCalories'>]?.notes ||
      ''
    );
  };

  // Set notes for a specific meal
  const setMealNotesForType = (mealType: string, notes: string) => {
    const noteKey = `${selectedPlan}-${selectedDay}-${mealType}`;
    setMealNotes((prev) => ({
      ...prev,
      [noteKey]: notes,
    }));
  };

  // Render meal detail with ingredients and recipe
  const renderMealDetail = (meal: MealData, mealType: string) => {
    const isUpdating = updatingMeal === `${selectedDay}-${mealType}`;
    const noteValue = getMealNotes(mealType);

    return (
      <View style={styles.mealDetailCard}>
        <View style={styles.mealDetailHeader}>
          <View style={styles.mealTypeRow}>
            <Text style={styles.mealTypeIcon}>
              {mealType === 'breakfast' ? '☀️' : mealType === 'lunch' ? '🌞' : '🌙'}
            </Text>
            <Text style={styles.mealTypeText}>
              {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </Text>
          </View>
          <Text style={styles.caloriesText}>{meal.calories} cal</Text>
        </View>

        <Text style={styles.mealName}>{meal.name}</Text>

        <Text style={styles.sectionTitle}>Ingredients:</Text>
        <View style={styles.ingredientsList}>
          {meal.ingredients && meal.ingredients.length > 0 ? (
            meal.ingredients.map((ingredient, index) => (
              <Text key={index} style={styles.ingredientItem}>
                • {ingredient}
              </Text>
            ))
          ) : (
            <Text style={styles.ingredientItem}>• No ingredients available</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Recipe:</Text>
        <View style={styles.recipeList}>
          {meal.recipes && meal.recipes.length > 0 ? (
            meal.recipes.map((step, index) => (
              <Text key={index} style={styles.recipeStep}>
                {index + 1}. {step}
              </Text>
            ))
          ) : (
            <Text style={styles.recipeStep}>No recipe available</Text>
          )}
        </View>

        {/* Notes Input */}
        <Text style={styles.sectionTitle}>Notes:</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Add your notes here..."
          value={noteValue}
          onChangeText={(text) => setMealNotesForType(mealType, text)}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <View style={styles.statusContainer}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              meal.isDone && styles.statusButtonCompleted,
              isUpdating && styles.statusButtonDisabled,
            ]}
            onPress={() => handleMealToggle(mealType)}
            disabled={isUpdating}>
            {isUpdating ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={meal.isDone ? '#FFFFFF' : '#666666'} />
                <Text
                  style={[
                    styles.statusButtonText,
                    meal.isDone && styles.statusButtonTextCompleted,
                  ]}>
                  Updating...
                </Text>
              </View>
            ) : (
              <Text
                style={[styles.statusButtonText, meal.isDone && styles.statusButtonTextCompleted]}>
                {meal.isDone ? 'Completed' : 'Mark as Complete'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render uploaded meal detail with ingredients and recipe (like original view)
  const renderUploadedMealDetail = (meal: UploadedMealData, mealType: string) => {
    return (
      <View style={styles.mealDetailCard}>
        <View style={styles.mealDetailHeader}>
          <View style={styles.mealTypeRow}>
            <Text style={styles.mealTypeIcon}>
              {mealType === 'breakfast' ? '☀️' : mealType === 'lunch' ? '🌞' : '🌙'}
            </Text>
            <Text style={styles.mealTypeText}>
              {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </Text>
          </View>
          <Text style={styles.caloriesText}>{meal.calories} cal</Text>
        </View>

        <Text style={styles.mealName}>{meal.name}</Text>

        <Text style={styles.sectionTitle}>Ingredients:</Text>
        <View style={styles.ingredientsList}>
          {meal.ingredients && meal.ingredients.length > 0 ? (
            meal.ingredients.map((ingredient, index) => (
              <Text key={index} style={styles.ingredientItem}>
                • {ingredient}
              </Text>
            ))
          ) : (
            <Text style={styles.ingredientItem}>• No ingredients available</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Recipe:</Text>
        <View style={styles.recipeList}>
          {meal.recipes && meal.recipes.length > 0 ? (
            meal.recipes.map((step, index) => (
              <Text key={index} style={styles.recipeStep}>
                {index + 1}. {step}
              </Text>
            ))
          ) : (
            <Text style={styles.recipeStep}>No recipe available</Text>
          )}
        </View>

        {/* Display notes if available */}
        {meal.notes && (
          <>
            <Text style={styles.sectionTitle}>Notes:</Text>
            <Text style={styles.uploadedMealNotes}>{meal.notes}</Text>
          </>
        )}

        {/* Status Display (Generated meals are always completed) */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusButton, styles.statusButtonCompleted]}>
            <Text style={[styles.statusButtonText, styles.statusButtonTextCompleted]}>
              Generated Meal
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5A8C" />
        <Text style={styles.loadingText}>Loading your meal plans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Meal Plans</Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddCompletePlan' as never)}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8B5A8C']}
            tintColor="#8B5A8C"
          />
        }>
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ongoing' && styles.activeTab]}
            onPress={() => handleTabSwitch('ongoing')}>
            <Text style={[styles.tabText, activeTab === 'ongoing' && styles.activeTabText]}>
              Ongoing ({ongoingPlans.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
            onPress={() => handleTabSwitch('upcoming')}>
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
              Upcoming ({upcomingPlans.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Select Meal Plan Section - Horizontal Cards */}
        <Text style={styles.sectionHeader}>Select Meal Plan</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.planScrollContainer}
          style={styles.planScrollView}>
          {(activeTab === 'ongoing' ? ongoingPlans : upcomingPlans).map((plan, index) => {
            const isSelected = selectedPlan === plan._id;
            const startDate = new Date(plan.startDate);
            const endDate = new Date(plan.endDate);

            return (
              <TouchableOpacity
                key={plan._id}
                style={[
                  styles.planCardHorizontal,
                  isSelected && styles.selectedPlanCardHorizontal,
                  index === 0 && styles.firstPlanCard,
                  index ===
                    (activeTab === 'ongoing'
                      ? ongoingPlans.length - 1
                      : upcomingPlans.length - 1) && styles.lastPlanCard,
                ]}
                onPress={() => handlePlanSelect(plan._id)}>
                <View style={styles.planCardContent}>
                  <Text style={[styles.planTitle, isSelected && styles.selectedPlanTitle]}>
                    {plan.name}
                  </Text>
                  <Text style={[styles.planDate, isSelected && styles.selectedPlanDate]}>
                    {startDate.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    -{' '}
                    {endDate.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={[styles.planDuration, isSelected && styles.selectedPlanDuration]}>
                    {plan.todoList.length} days
                  </Text>

                  {isSelected && (
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>Active</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* No Plan Selected Placeholder */}
        {!selectedPlan && (
          <View style={styles.noSelectionContainer}>
            <View style={styles.noSelectionContent}>
              <Text style={styles.noSelectionIcon}>📋</Text>
              <Text style={styles.noSelectionTitle}>
                Select a {activeTab === 'ongoing' ? 'Ongoing' : 'Upcoming'} Plan
              </Text>
              <Text style={styles.noSelectionSubtext}>
                Choose a meal plan from the {activeTab} section above to view its details, schedule,
                and options.
              </Text>
            </View>
          </View>
        )}

        {/* View Mode Selector - 3 Buttons */}
        {selectedPlan && (
          <View style={styles.viewModeContainer}>
            <Text style={styles.sectionHeader}>View Mode</Text>
            <View style={styles.viewModeButtons}>
              <TouchableOpacity
                style={[
                  styles.viewModeButton,
                  viewMode === 'original' && styles.activeViewModeButton,
                ]}
                onPress={() => handleViewModeChange('original')}>
                <Text
                  style={[
                    styles.viewModeButtonText,
                    viewMode === 'original' && styles.activeViewModeButtonText,
                  ]}>
                  Original
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.viewModeButton,
                  viewMode === 'alternate' && styles.activeViewModeButton,
                ]}
                onPress={() => handleViewModeChange('alternate')}>
                <Text
                  style={[
                    styles.viewModeButtonText,
                    viewMode === 'alternate' && styles.activeViewModeButtonText,
                  ]}>
                  Alternate
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.viewModeButton,
                  viewMode === 'upload' && styles.activeViewModeButton,
                ]}
                onPress={() => handleViewModeChange('upload')}>
                <Text
                  style={[
                    styles.viewModeButtonText,
                    viewMode === 'upload' && styles.activeViewModeButtonText,
                  ]}>
                  Upload
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Select Day Section - Only show when Original mode is selected */}
        {selectedPlan && viewMode === 'original' && (
          <>
            <Text style={styles.sectionHeader}>Select Day</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayScrollContent}>
              {currentPlan?.todoList.map((day) => {
                const dayDate = new Date(day.date);
                const isSelected = selectedDay === day.day;

                return (
                  <TouchableOpacity
                    key={day.day}
                    style={[styles.dayCard, isSelected && styles.selectedDayCard]}
                    onPress={() => setSelectedDay(day.day)}>
                    <Text style={[styles.dayTitle, isSelected && styles.selectedDayTitle]}>
                      Day {day.day}
                    </Text>
                    <Text style={[styles.dayDate, isSelected && styles.selectedDayDate]}>
                      {dayDate.toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                    <Text style={[styles.dayCalories, isSelected && styles.selectedDayCalories]}>
                      {day.dailyCalories} cal
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Day Meals Section */}
            {currentDay && (
              <>
                <Text style={styles.sectionHeader}>
                  Day {selectedDay} Meals ({currentDay.dailyCalories} calories)
                </Text>

                {/* Breakfast */}
                {currentDay.breakfast && renderMealDetail(currentDay.breakfast, 'breakfast')}

                {/* Lunch */}
                {currentDay.lunch && renderMealDetail(currentDay.lunch, 'lunch')}

                {/* Dinner */}
                {currentDay.dinner && renderMealDetail(currentDay.dinner, 'dinner')}
              </>
            )}
          </>
        )}

        {/* Alternate View Mode Content */}
        {selectedPlan && viewMode === 'alternate' && (
          <View style={styles.alternateContainer}>
            <Text style={styles.sectionHeader}>Alternate Meal Options</Text>
            <Text style={styles.planIdDebug}>
              Plan: {currentPlan?.name || 'Unknown Plan'} (ID: {selectedPlan})
            </Text>

            {/* Generate Alternate Plan Button - Only show if not generated yet */}
            {!alternateGenerated[selectedPlan] && (
              <TouchableOpacity
                style={styles.generateAlternateButton}
                onPress={() => generateAlternatePlan(selectedPlan)}
                disabled={alternateLoading}>
                <Text style={styles.generateAlternateIcon}>🛒</Text>
                <Text style={styles.generateAlternateTitle}>
                  {alternateLoading ? 'Generating...' : 'Generate Alternate Meal Plan'}
                </Text>
                <Text style={styles.generateAlternateSubtext}>
                  Create alternative meal options based on grocery list
                </Text>
                {alternateLoading && (
                  <ActivityIndicator size="small" color="#8B5A8C" style={{ marginTop: 8 }} />
                )}
              </TouchableOpacity>
            )}

            {/* Alternate Plan Display - Similar to Original Mode */}
            {alternateGenerated[selectedPlan] && alternatePlans[selectedPlan] && alternatePlans[selectedPlan].length > 0 && (
              <>
                {/* Select Day Section for Alternate Plans */}
                <Text style={styles.sectionHeader}>Select Day</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dayScrollContent}>
                  {alternatePlans[selectedPlan][0]?.todoList.map((day) => {
                    const dayDate = new Date(day.date);
                    const isSelected = selectedDay === day.day;

                    return (
                      <TouchableOpacity
                        key={day.day}
                        style={[styles.dayCard, isSelected && styles.selectedDayCard]}
                        onPress={() => setSelectedDay(day.day)}>
                        <Text style={[styles.dayTitle, isSelected && styles.selectedDayTitle]}>
                          Day {day.day}
                        </Text>
                        <Text style={[styles.dayDate, isSelected && styles.selectedDayDate]}>
                          {dayDate.toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </Text>
                        <Text style={[styles.dayCalories, isSelected && styles.selectedDayCalories]}>
                          {day.dailyCalories} cal
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Day Meals Section for Alternate Plans */}
                {alternatePlans[selectedPlan][0]?.todoList.find(day => day.day === selectedDay) && (
                  <>
                    <Text style={styles.sectionHeader}>
                      Day {selectedDay} Alternate Meals ({alternatePlans[selectedPlan][0].todoList.find(day => day.day === selectedDay)?.dailyCalories} calories)
                    </Text>

                    {/* Breakfast */}
                    {alternatePlans[selectedPlan][0].todoList.find(day => day.day === selectedDay)?.breakfast && 
                      renderMealDetail(
                        alternatePlans[selectedPlan][0].todoList.find(day => day.day === selectedDay)!.breakfast, 
                        'breakfast'
                      )
                    }

                    {/* Lunch */}
                    {alternatePlans[selectedPlan][0].todoList.find(day => day.day === selectedDay)?.lunch && 
                      renderMealDetail(
                        alternatePlans[selectedPlan][0].todoList.find(day => day.day === selectedDay)!.lunch, 
                        'lunch'
                      )
                    }

                    {/* Dinner */}
                    {alternatePlans[selectedPlan][0].todoList.find(day => day.day === selectedDay)?.dinner && 
                      renderMealDetail(
                        alternatePlans[selectedPlan][0].todoList.find(day => day.day === selectedDay)!.dinner, 
                        'dinner'
                      )
                    }

                    {/* Regenerate Button */}
                    <TouchableOpacity
                      style={styles.regenerateButton}
                      onPress={async () => {
                        const newAlternateGenerated = {
                          ...alternateGenerated,
                          [selectedPlan]: false
                        };
                        const newAlternatePlans = {
                          ...alternatePlans,
                          [selectedPlan]: []
                        };
                        
                        setAlternateGenerated(newAlternateGenerated);
                        setAlternatePlans(newAlternatePlans);
                        
                        // Update storage
                        await saveAlternatePlansToStorage(newAlternatePlans, newAlternateGenerated);
                      }}>
                      <Text style={styles.regenerateButtonText}>🔄 Generate New Alternate Plan</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>
        )}

        {/* Upload View Mode Content */}
        {selectedPlan && viewMode === 'upload' && (
          <View style={styles.uploadContainer}>
            <Text style={styles.sectionHeader}>Generated Meal Plans</Text>
            <Text style={styles.planIdDebug}>
              Plan: {currentPlan?.name || 'Unknown Plan'} (ID: {selectedPlan})
            </Text>

            {/* Upload New Photo Button - Only show if no uploaded plans */}
            {!uploadedPlansLoading && uploadedPlans.length === 0 && (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() =>
                  (navigation as any).navigate('UploadImageScreen', {
                    planId: selectedPlan,
                    plansId: selectedPlan,
                    planName: currentPlan?.name || 'Meal Plan',
                  })
                }>
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadTitle}>Upload Meal Photo</Text>
                <Text style={styles.uploadSubtext}>
                  Take a photo of your fridge or ingredients to generate personalized meal plans
                </Text>
              </TouchableOpacity>
            )}

            {/* Loading State */}
            {uploadedPlansLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B5A8C" />
                <Text style={styles.loadingText}>Loading uploaded meal plans...</Text>
              </View>
            )}

            {/* Uploaded Plans - Display like original view mode */}
            {!uploadedPlansLoading && uploadedPlans.length > 0 && (
              <>
                {/* Select Day Section for Uploaded Plans */}
                <Text style={styles.sectionHeader}>Select Day</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dayScrollContent}>
                  {uploadedPlans[0]?.todoList.map((day) => {
                    const dayDate = new Date(day.date);
                    const isSelected = selectedDay === day.day;

                    return (
                      <TouchableOpacity
                        key={day.day}
                        style={[styles.dayCard, isSelected && styles.selectedDayCard]}
                        onPress={() => setSelectedDay(day.day)}>
                        <Text style={[styles.dayTitle, isSelected && styles.selectedDayTitle]}>
                          Day {day.day}
                        </Text>
                        <Text style={[styles.dayDate, isSelected && styles.selectedDayDate]}>
                          {dayDate.toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </Text>
                        <Text
                          style={[styles.dayCalories, isSelected && styles.selectedDayCalories]}>
                          {day.dailycalories} cal
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Day Meals Section for Uploaded Plans */}
                {uploadedPlans[0]?.todoList.find((day) => day.day === selectedDay) && (
                  <>
                    <Text style={styles.sectionHeader}>
                      Day {selectedDay} Generated Meals (
                      {
                        uploadedPlans[0].todoList.find((day) => day.day === selectedDay)
                          ?.dailycalories
                      }{' '}
                      calories)
                    </Text>

                    {/* Generated Photo Display */}
                    {uploadedPlans[0].photoUrl && (
                      <View style={styles.generatedPhotoContainer}>
                        <Text style={styles.sectionTitle}>Original Photo:</Text>
                        <Image
                          source={{ uri: uploadedPlans[0].photoUrl }}
                          style={styles.generatedPhotoImage}
                        />
                        {uploadedPlans[0].notes && (
                          <View style={styles.generatedPhotoNotes}>
                            <Text style={styles.generatedPhotoNotesTitle}>Analysis Notes:</Text>
                            <Text style={styles.generatedPhotoNotesText}>
                              {uploadedPlans[0].notes}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Breakfast */}
                    {uploadedPlans[0].todoList.find((day) => day.day === selectedDay)?.breakfast &&
                      renderUploadedMealDetail(
                        uploadedPlans[0].todoList.find((day) => day.day === selectedDay)!.breakfast,
                        'breakfast'
                      )}

                    {/* Lunch */}
                    {uploadedPlans[0].todoList.find((day) => day.day === selectedDay)?.lunch &&
                      renderUploadedMealDetail(
                        uploadedPlans[0].todoList.find((day) => day.day === selectedDay)!.lunch,
                        'lunch'
                      )}

                    {/* Dinner */}
                    {uploadedPlans[0].todoList.find((day) => day.day === selectedDay)?.dinner &&
                      renderUploadedMealDetail(
                        uploadedPlans[0].todoList.find((day) => day.day === selectedDay)!.dinner,
                        'dinner'
                      )}
                  </>
                )}
              </>
            )}

            {/* No Uploaded Plans */}
            {!uploadedPlansLoading && uploadedPlans.length === 0 && (
              <View style={styles.noUploadedPlansContainer}>
                <Text style={styles.noUploadedPlansIcon}>📋</Text>
                <Text style={styles.noUploadedPlansTitle}>No Generated Meal Plans</Text>
                <Text style={styles.noUploadedPlansText}>
                  Upload a photo of your fridge or ingredients to generate personalized meal plans!
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#333333',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5A8C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '300',
  },

  // Scrollable Content
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Tab Container
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: '#8B5A8C',
    fontWeight: '600',
  },

  // Section Headers
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
    marginTop: 8,
  },

  // Plan Cards
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  selectedPlanCard: {
    borderColor: '#8B5A8C',
    position: 'relative',
  },
  planCardContent: {
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  selectedPlanTitle: {
    color: '#8B5A8C',
  },
  planDate: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  selectedPlanDate: {
    color: '#333333',
  },
  planDuration: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 12,
  },
  selectedPlanDuration: {
    color: '#666666',
  },
  uploadPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  uploadPhotoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  uploadPhotoText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  statusBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Day Cards
  dayScrollContent: {
    paddingRight: 20,
    gap: 12,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    minWidth: 140,
  },
  selectedDayCard: {
    borderColor: '#8B5A8C',
    backgroundColor: '#F8F6F8',
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  selectedDayTitle: {
    color: '#8B5A8C',
  },
  dayDate: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  selectedDayDate: {
    color: '#333333',
  },
  dayCalories: {
    fontSize: 14,
    color: '#8B5A8C',
    fontWeight: '600',
  },
  selectedDayCalories: {
    color: '#8B5A8C',
  },

  // Meal Detail Cards
  mealDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  mealDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTypeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  mealTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5A8C',
  },
  caloriesText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    marginTop: 8,
  },
  ingredientsList: {
    marginBottom: 16,
  },
  ingredientItem: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
    lineHeight: 20,
  },
  recipeList: {
    marginBottom: 20,
  },
  recipeStep: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 20,
  },

  // Notes Input
  notesInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
    fontSize: 14,
    color: '#333333',
    marginBottom: 16,
    minHeight: 80,
  },

  // Status Container and Button
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 140,
    alignItems: 'center',
  },
  statusButtonCompleted: {
    backgroundColor: '#4CAF50',
  },
  statusButtonDisabled: {
    opacity: 0.6,
  },
  statusButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  statusButtonTextCompleted: {
    color: '#FFFFFF',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Horizontal Plan Cards Styles
  planScrollView: {
    marginBottom: 20,
  },
  planScrollContainer: {
    paddingLeft: 20,
    paddingRight: 4,
    paddingVertical: 8,
    gap: 12,
  },
  planCardHorizontal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: 260,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  selectedPlanCardHorizontal: {
    borderColor: '#8B5A8C',
    borderWidth: 2,
    backgroundColor: '#FDF4FF',
  },
  firstPlanCard: {
    marginLeft: 0,
  },
  lastPlanCard: {
    marginRight: 20,
  },

  // View Mode Styles
  viewModeContainer: {
    marginBottom: 20,
  },
  viewModeButtons: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 4,
    marginTop: 8,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeViewModeButton: {
    backgroundColor: '#8B5A8C',
    shadowColor: '#8B5A8C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  viewModeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeViewModeButtonText: {
    color: '#FFFFFF',
  },

  // Alternate View Styles
  alternateContainer: {
    paddingVertical: 20,
  },
  comingSoonContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  comingSoonText: {
    fontSize: 48,
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Upload View Styles
  uploadContainer: {
    paddingVertical: 20,
  },
  uploadButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8B5A8C',
    borderStyle: 'dashed',
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B5A8C',
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },

  // No Selection Placeholder Styles
  noSelectionContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noSelectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  noSelectionIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noSelectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  noSelectionSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Debug Style
  planIdDebug: {
    fontSize: 12,
    color: '#8B5A8C',
    fontWeight: '600',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#F8F6F8',
    borderRadius: 6,
    textAlign: 'center',
  },

  // Uploaded Plans Styles
  uploadedPlansContainer: {
    marginTop: 20,
  },
  uploadedPlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadedPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadedPlanTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B5A8C',
  },
  uploadedPlanDate: {
    fontSize: 12,
    color: '#666666',
  },
  uploadedPlanImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  uploadedPlanNotes: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  uploadedPlanNotesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  uploadedPlanNotesText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
  },
  uploadedPlanDays: {
    marginTop: 8,
  },
  uploadedPlanDaysTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  uploadedDayCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  uploadedDayTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5A8C',
    marginBottom: 8,
  },
  uploadedMealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8B5A8C',
  },
  uploadedMealTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  uploadedMealCalories: {
    fontSize: 12,
    color: '#8B5A8C',
    fontWeight: '500',
    marginBottom: 4,
  },
  uploadedMealIngredients: {
    fontSize: 11,
    color: '#666666',
    lineHeight: 16,
  },
  noUploadedPlansContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 20,
  },
  noUploadedPlansIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noUploadedPlansTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  noUploadedPlansText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Generated Photo Styles
  generatedPhotoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  generatedPhotoImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  generatedPhotoNotes: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  generatedPhotoNotesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  generatedPhotoNotesText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
  },

  // Uploaded Meal Notes
  uploadedMealNotes: {
    fontSize: 14,
    color: '#666666',
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    lineHeight: 20,
  },

  // Generate Alternate Button Styles
  generateAlternateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8B5A8C',
    borderStyle: 'solid',
    marginBottom: 20,
  },
  generateAlternateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  generateAlternateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B5A8C',
    marginBottom: 8,
    textAlign: 'center',
  },
  generateAlternateSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Regenerate Button
  regenerateButton: {
    backgroundColor: '#F8F6F8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#8B5A8C',
  },
  regenerateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5A8C',
  },
});
