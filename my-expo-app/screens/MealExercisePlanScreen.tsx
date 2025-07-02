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
  TextInput,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { updateMealExerciseStatus } from '../services/mealPlanService';

const BASE_URL = 'https://api-fitemeal.vercel.app';

// Interface untuk exercise data
interface ExerciseData {
  name: string;
  sets: number;
  reps: string;
  targetMuscle: string;
  equipment: string;
  // Removed isDone from individual exercises
}

// Interface untuk workout data
interface WorkoutData {
  exerciseName: string;
  totalSession: string;
  exercises: ExerciseData[];
  caloriesBurned: number;
  notes: string;
  isDone: boolean; // Added isDone at exercise level
}

// Interface untuk meal data
interface MealData {
  name: string;
  imageUrl: string;
  calories: number;
  ingredients: string[];
  recipes: string[];
  isDone: boolean;
  notes: string;
}

// Interface untuk day data
interface DayData {
  day: number;
  date: string;
  dailyCalories: number;
  breakfast: MealData;
  lunch: MealData;
  dinner: MealData;
  exercise: WorkoutData;
}

// Interface untuk plan data
interface PlanData {
  _id: string;
  name: string;
  userId: string;
  startDate: string;
  endDate: string;
  dailyCalories: number;
  duration: number;
  goal: string;
  todoList: DayData[];
  createdAt: string;
  updatedAt: string;
}

export default function MealExercisePlanScreen() {
  const navigation = useNavigation();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedView, setSelectedView] = useState<'meals' | 'exercise'>('meals'); // New state for view toggle
  const [updatingMeal, setUpdatingMeal] = useState<string | null>(null);
  const [updatingExercise, setUpdatingExercise] = useState<string | null>(null);
  const [mealNotes, setMealNotes] = useState<{ [key: string]: string }>({});
  const [exerciseNotes, setExerciseNotes] = useState<{ [key: string]: string }>({});

  // Helper function to format date to Indonesian format
  const formatDateToIndonesian = (dateString: string): string => {
    const date = new Date(dateString);
    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  };

  useEffect(() => {
    fetchMealExercisePlans();
  }, []);

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

        // Update body structure sesuai dengan contoh API Postman
        const body = {
          day: day,
          planType: 'meal', // Specify this is a meal plan update
          type: type, // breakfast, lunch, dinner
          isDone: isDone,
          notes: notes || `Sudah selesai makan ${type}, rasanya enak!`,
        };

        console.log(
          'Sending meal update request to:',
          `${BASE_URL}/api/add-meal-exercise/${planId}`
        );
        console.log('Request body:', body);

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
        console.log('✅ Meal update successful:', result);

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
                        ...dayData[
                          type as keyof Omit<DayData, 'date' | 'day' | 'dailyCalories' | 'exercise'>
                        ],
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

  // Update exercise completion status - Day level completion using service
  const updateExerciseStatus = useCallback(
    async (planId: string, day: number, isDone: boolean, notes: string) => {
      try {
        setUpdatingExercise(`${day}-exercise`);

        // Use the service function with proper planType
        await updateMealExerciseStatus(planId, day, isDone, notes);

        // Update local state - Update isDone at exercise level
        setPlans((prevPlans) =>
          prevPlans.map((plan) => {
            if (plan._id === planId) {
              return {
                ...plan,
                todoList: plan.todoList.map((dayData) => {
                  if (dayData.day === day) {
                    return {
                      ...dayData,
                      exercise: {
                        ...dayData.exercise,
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
        const noteKey = `${selectedPlan}-${day}-exercise`;
        setExerciseNotes((prev) => ({
          ...prev,
          [noteKey]: '',
        }));

        Alert.alert('Success', `Exercise marked as ${isDone ? 'completed' : 'incomplete'}!`);
      } catch (error) {
        console.error('❌ Error updating exercise status:', error);
        Alert.alert('Error', 'Failed to update exercise status. Please try again.');
      } finally {
        setUpdatingExercise(null);
      }
    },
    [selectedPlan]
  );

  // Fetch meal & exercise plans
  const fetchMealExercisePlans = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');

      if (!token) {
        Alert.alert('Error', 'No access token found');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/add-meal-exercise`, {
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
      console.log('📄 Meal & Exercise Plans API Response:', JSON.stringify(result, null, 2));

      // Merge ongoing and upcoming plans
      let plansData: PlanData[] = [];
      if (result.data) {
        if (Array.isArray(result.data)) {
          plansData = result.data;
        } else {
          // Handle structure with ongoing and upcoming arrays
          const ongoing = result.data.ongoing || [];
          const upcoming = result.data.upcoming || [];
          plansData = [...ongoing, ...upcoming];
        }
      }
      setPlans(plansData);

      // Auto-select first plan if available
      if (!selectedPlan && plansData.length > 0) {
        setSelectedPlan(plansData[0]._id);
      }
    } catch (error) {
      console.error('❌ Error fetching meal & exercise plans:', error);
      Alert.alert('Error', 'Failed to fetch meal & exercise plans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPlan]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMealExercisePlans();
  }, [fetchMealExercisePlans]);

  // Get current plan
  const currentPlan = plans.find((plan) => plan._id === selectedPlan);

  // Get current day data
  const currentDay = currentPlan?.todoList.find((day) => day.day === selectedDay);

  // Handle meal toggle
  const handleMealToggle = async (mealType: string) => {
    if (!selectedPlan || !currentDay) return;

    const meal = currentDay[
      mealType as keyof Omit<DayData, 'date' | 'day' | 'dailyCalories' | 'exercise'>
    ] as MealData;
    const noteKey = `${selectedPlan}-${selectedDay}-${mealType}`;
    const notes = mealNotes[noteKey] || meal.notes || '';

    await updateMealStatus(selectedPlan, selectedDay, mealType, !meal.isDone, notes);
  };

  // Handle exercise toggle - Day level completion
  const handleExerciseToggle = async () => {
    if (!selectedPlan || !currentDay) return;

    const noteKey = `${selectedPlan}-${selectedDay}-exercise`;
    const notes = exerciseNotes[noteKey] || currentDay.exercise.notes || '';

    await updateExerciseStatus(selectedPlan, selectedDay, !currentDay.exercise.isDone, notes);
  };

  // Get meal notes
  const getMealNotes = (mealType: string) => {
    const noteKey = `${selectedPlan}-${selectedDay}-${mealType}`;
    return (
      mealNotes[noteKey] ||
      currentDay?.[mealType as keyof Omit<DayData, 'date' | 'day' | 'dailyCalories' | 'exercise'>]
        ?.notes ||
      ''
    );
  };

  // Set meal notes
  const setMealNotesForType = (mealType: string, notes: string) => {
    const noteKey = `${selectedPlan}-${selectedDay}-${mealType}`;
    setMealNotes((prev) => ({
      ...prev,
      [noteKey]: notes,
    }));
  };

  // Get exercise notes
  const getExerciseNotes = () => {
    const noteKey = `${selectedPlan}-${selectedDay}-exercise`;
    return exerciseNotes[noteKey] || currentDay?.exercise?.notes || '';
  };

  // Set exercise notes
  const setExerciseNotesForDay = (notes: string) => {
    const noteKey = `${selectedPlan}-${selectedDay}-exercise`;
    setExerciseNotes((prev) => ({
      ...prev,
      [noteKey]: notes,
    }));
  };

  // Render meal card
  const renderMealCard = (meal: MealData, mealType: string) => {
    const isUpdating = updatingMeal === `${selectedDay}-${mealType}`;
    const noteValue = getMealNotes(mealType);

    return (
      <View style={styles.mealCard} key={mealType}>
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleRow}>
            <Text style={styles.mealIcon}>
              {mealType === 'breakfast' ? '☀️' : mealType === 'lunch' ? '🌞' : '🌙'}
            </Text>
            <Text style={styles.mealType}>
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
            <Text style={styles.recipeStep}>• No recipe available</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Notes:</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Add your notes here..."
          placeholderTextColor="#999"
          value={noteValue}
          onChangeText={(text) => setMealNotesForType(mealType, text)}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

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
                style={[styles.statusButtonText, meal.isDone && styles.statusButtonTextCompleted]}>
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
    );
  };

  // Render exercise card - No completion button, read-only
  const renderExerciseCard = (exercise: ExerciseData, index: number) => {
    return (
      <View style={styles.exerciseCard} key={index}>
        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          {/* Removed completion button from individual exercises */}
        </View>
        <Text style={styles.exerciseDetails}>
          {exercise.sets} sets × {exercise.reps}
        </Text>
        <Text style={styles.exerciseTarget}>Target: {exercise.targetMuscle}</Text>
        <Text style={styles.exerciseEquipment}>Equipment: {exercise.equipment}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading your plans...</Text>
      </View>
    );
  }

  if (plans.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#8B0000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meal & Exercise Plans</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No meal & exercise plans found</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('PlanSelection' as never)}>
            <Text style={styles.createButtonText}>Create New Plan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#8B0000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meal & Exercise Plans</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}>
        {/* Plan Selector */}
        <View style={styles.planSelector}>
          <Text style={styles.sectionTitle}>Select Plan</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.planScrollView}>
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan._id}
                style={[styles.planButton, selectedPlan === plan._id && styles.planButtonSelected]}
                onPress={() => {
                  setSelectedPlan(plan._id);
                  setSelectedDay(1);
                }}>
                <Text
                  style={[
                    styles.planButtonText,
                    selectedPlan === plan._id && styles.planButtonTextSelected,
                  ]}>
                  {plan.name}
                </Text>
                <Text
                  style={[
                    styles.planButtonSubtext,
                    selectedPlan === plan._id && styles.planButtonSubtextSelected,
                  ]}>
                  {plan.duration} days • {plan.goal}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Day Selector */}
        {currentPlan && (
          <View style={styles.daySelector}>
            <Text style={styles.sectionTitle}>Select Day</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dayScrollView}>
              {currentPlan.todoList.map((day) => (
                <TouchableOpacity
                  key={day.day}
                  style={[styles.dayButton, selectedDay === day.day && styles.dayButtonSelected]}
                  onPress={() => setSelectedDay(day.day)}>
                  <Text
                    style={[
                      styles.dayButtonText,
                      selectedDay === day.day && styles.dayButtonTextSelected,
                    ]}>
                    Day {day.day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* View Toggle Selector */}
        {currentDay && (
          <View style={styles.viewSelector}>
            <Text style={styles.sectionTitle}>View</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  selectedView === 'meals' && styles.toggleButtonSelected,
                ]}
                onPress={() => setSelectedView('meals')}>
                <Text
                  style={[
                    styles.toggleButtonText,
                    selectedView === 'meals' && styles.toggleButtonTextSelected,
                  ]}>
                  Meals
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  selectedView === 'exercise' && styles.toggleButtonSelected,
                ]}
                onPress={() => setSelectedView('exercise')}>
                <Text
                  style={[
                    styles.toggleButtonText,
                    selectedView === 'exercise' && styles.toggleButtonTextSelected,
                  ]}>
                  Exercise
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Current Day Content */}
        {currentDay && (
          <View style={styles.contentContainer}>
            <Text style={styles.dayTitle}>
              Day {currentDay.day} - {formatDateToIndonesian(currentDay.date)}
            </Text>
            <Text style={styles.dailyCalories}>
              Daily Target: {currentDay.dailyCalories} calories
            </Text>

            {/* Conditionally render based on selected view */}
            {selectedView === 'meals' && (
              <View style={styles.mealsSection}>
                <Text style={styles.sectionTitle}>Meals</Text>
                {renderMealCard(currentDay.breakfast, 'breakfast')}
                {renderMealCard(currentDay.lunch, 'lunch')}
                {renderMealCard(currentDay.dinner, 'dinner')}
              </View>
            )}

            {selectedView === 'exercise' && (
              <View style={styles.exerciseSection}>
                <Text style={styles.sectionTitle}>Exercise</Text>
                <View style={styles.exerciseOverview}>
                  <View style={styles.exerciseOverviewContent}>
                    <Text style={styles.exerciseSessionName}>
                      {currentDay.exercise.exerciseName}
                    </Text>
                    <Text style={styles.exerciseSessionDuration}>
                      {currentDay.exercise.totalSession}
                    </Text>
                    <Text style={styles.exerciseCalories}>
                      {currentDay.exercise.caloriesBurned} calories to burn
                    </Text>
                  </View>

                  {/* Exercise Mark as Complete Button */}
                  <TouchableOpacity
                    style={[
                      styles.exerciseCompletionButton,
                      currentDay.exercise.isDone && styles.exerciseCompletionButtonCompleted,
                      updatingExercise === `${selectedDay}-exercise` &&
                        styles.exerciseCompletionButtonDisabled,
                    ]}
                    onPress={handleExerciseToggle}
                    disabled={updatingExercise === `${selectedDay}-exercise`}>
                    {updatingExercise === `${selectedDay}-exercise` ? (
                      <ActivityIndicator
                        size="small"
                        color={currentDay.exercise.isDone ? '#FFFFFF' : '#666666'}
                      />
                    ) : (
                      <>
                        <Ionicons
                          name={currentDay.exercise.isDone ? 'checkmark-circle' : 'ellipse-outline'}
                          size={20}
                          color={currentDay.exercise.isDone ? '#FFFFFF' : '#F59E0B'}
                        />
                        <Text
                          style={[
                            styles.exerciseCompletionButtonText,
                            currentDay.exercise.isDone &&
                              styles.exerciseCompletionButtonTextCompleted,
                          ]}>
                          {currentDay.exercise.isDone ? 'Completed' : 'Mark as Complete'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Exercises:</Text>
                {currentDay.exercise.exercises.map((exercise, index) =>
                  renderExerciseCard(exercise, index)
                )}

                <Text style={styles.sectionTitle}>Exercise Notes:</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Add your exercise notes here..."
                  placeholderTextColor="#999"
                  value={getExerciseNotes()}
                  onChangeText={setExerciseNotesForDay}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  planSelector: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  planScrollView: {
    flexDirection: 'row',
  },
  planButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    minWidth: 150,
  },
  planButtonSelected: {
    backgroundColor: '#8B0000',
    borderColor: '#8B0000',
  },
  planButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  planButtonTextSelected: {
    color: '#FFFFFF',
  },
  planButtonSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  planButtonSubtextSelected: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  daySelector: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  dayScrollView: {
    flexDirection: 'row',
  },
  dayButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  dayButtonSelected: {
    backgroundColor: '#8B0000',
    borderColor: '#8B0000',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  contentContainer: {
    padding: 16,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  dailyCalories: {
    fontSize: 14,
    color: '#8B0000',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 20,
  },
  mealsSection: {
    marginBottom: 20,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  caloriesText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  mealName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 12,
  },
  ingredientsList: {
    marginBottom: 12,
  },
  ingredientItem: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  recipeList: {
    marginBottom: 12,
  },
  recipeStep: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  notesInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 12,
    minHeight: 60,
  },
  statusButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonCompleted: {
    backgroundColor: '#10B981',
  },
  statusButtonDisabled: {
    opacity: 0.7,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  statusButtonTextCompleted: {
    color: '#FFFFFF',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseSection: {
    marginBottom: 20,
  },
  exerciseOverview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseOverviewContent: {
    flex: 1,
  },
  exerciseSessionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  exerciseSessionDuration: {
    fontSize: 14,
    color: '#F59E0B',
    marginBottom: 4,
  },
  exerciseCalories: {
    fontSize: 12,
    color: '#6B7280',
  },
  exerciseCompletionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
    gap: 6,
  },
  exerciseCompletionButtonCompleted: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  exerciseCompletionButtonDisabled: {
    opacity: 0.7,
  },
  exerciseCompletionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  exerciseCompletionButtonTextCompleted: {
    color: '#FFFFFF',
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  exerciseDetails: {
    fontSize: 12,
    color: '#F59E0B',
    marginBottom: 4,
  },
  exerciseTarget: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  exerciseEquipment: {
    fontSize: 12,
    color: '#6B7280',
  },
  // New toggle button styles
  viewSelector: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonSelected: {
    backgroundColor: '#8B0000',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleButtonTextSelected: {
    color: '#FFFFFF',
  },
});
