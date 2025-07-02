import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';

type MealExercisePlanScreenProps = {
  navigation: any;
  route?: any;
};

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  targetMuscle: string;
  equipment: string;
  isDone: boolean;
}

interface ExerciseData {
  exerciseName: string;
  totalSession: string;
  exercises: Exercise[];
  caloriesBurned: number;
  notes: string;
}

interface MealData {
  name: string;
  imageUrl: string;
  calories: number;
  ingredients: string[];
  recipes: string[];
  isDone: boolean;
  notes: string;
}

interface DayData {
  day: number;
  date: string;
  dailyCalories: number;
  breakfast: MealData;
  lunch: MealData;
  dinner: MealData;
  exercise: ExerciseData;
}

interface PlanData {
  name: string;
  userId: string;
  startDate: string;
  endDate: string;
  dailyCalories: number;
  duration: number;
  goal: string;
  todoList: DayData[];
}

export default function MealExercisePlanScreen({ navigation, route }: MealExercisePlanScreenProps) {
  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [completedMeals, setCompletedMeals] = useState(0);
  const [totalMeals, setTotalMeals] = useState(3);
  const [completedExercises, setCompletedExercises] = useState(0);
  const [totalExercises, setTotalExercises] = useState(0);

  useEffect(() => {
    loadPlanData();
  }, []);

  useEffect(() => {
    if (planData) {
      updateProgress();
    }
  }, [planData, selectedDay]);

  const loadPlanData = async () => {
    try {
      setLoading(true);

      // Get token and user ID
      const token = await SecureStore.getItemAsync('access_token');
      const userId = await SecureStore.getItemAsync('user_id');

      console.log('🔍 MealExercisePlanScreen: Loading plan data...');
      console.log('Token exists:', !!token);
      console.log('User ID:', userId);

      if (!token || !userId) {
        console.error('❌ No token or user ID found');
        Alert.alert('Authentication Required', 'Please login to view your plans.');
        return;
      }

      // Fetch meal & exercise plan from API
      const response = await fetch(
        `https://api-fitemeal.vercel.app/api/meal-exercise-plans/${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Plan data loaded:', result);

      // Set the fetched data
      if (result && result.data) {
        setPlanData(result.data);
      } else if (result) {
        setPlanData(result);
      } else {
        console.log('⚠️ No plan data found');
        Alert.alert('No Plans Found', "You don't have any meal & exercise plans yet.");
      }
    } catch (error) {
      console.error('❌ Error loading plan data:', error);

      // For development - show mock data if API fails
      console.log('🔄 Using mock data for development...');
      const currentUserId = (await SecureStore.getItemAsync('user_id')) || 'current-user';

      const mockPlanData: PlanData = {
        name: 'Sample Meal & Exercise Plan',
        userId: currentUserId,
        startDate: '2026-12-30T00:00:00.000Z',
        endDate: '2027-01-05T00:00:00.000Z',
        dailyCalories: 2379,
        duration: 7,
        goal: 'cutting',
        todoList: [
          {
            day: 1,
            date: '2026-12-30',
            dailyCalories: 2379,
            breakfast: {
              name: 'Nasi Merah Pecel',
              imageUrl: '',
              calories: 595,
              ingredients: ['100g beras merah', '70g sayuran rebus', '30g tempe goreng'],
              recipes: ['Masak beras merah hingga matang', 'Rebus aneka sayuran'],
              isDone: false,
              notes: 'Gunakan sambal pecel secukupnya',
            },
            lunch: {
              name: 'Nasi Merah Ayam Bakar',
              imageUrl: '',
              calories: 835,
              ingredients: ['130g beras merah', '100g ayam dada', '25g sambal taliwang'],
              recipes: ['Marinasi ayam dengan bumbu taliwang', 'Masak nasi merah'],
              isDone: false,
              notes: 'Pilih dada ayam tanpa kulit',
            },
            dinner: {
              name: 'Nasi Merah Sup Ikan',
              imageUrl: '',
              calories: 950,
              ingredients: ['120g beras merah', '100g ikan kakap', '100g sayuran'],
              recipes: ['Masak nasi merah', 'Buat sup ikan dengan sayuran'],
              isDone: false,
              notes: 'Tambahkan sayuran hijau untuk nutrisi',
            },
            exercise: {
              exerciseName: 'Full Body Workout',
              totalSession: '45 menit',
              exercises: [
                {
                  name: 'Push-ups',
                  sets: 3,
                  reps: '10-15',
                  targetMuscle: 'Chest, triceps, shoulders',
                  equipment: 'Bodyweight',
                  isDone: false,
                },
                {
                  name: 'Squats',
                  sets: 3,
                  reps: '15-20',
                  targetMuscle: 'Legs, glutes',
                  equipment: 'Bodyweight',
                  isDone: false,
                },
              ],
              caloriesBurned: 360,
              notes: 'Istirahat 60 detik antar set',
            },
          },
        ],
      };

      setPlanData(mockPlanData);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentDayData = () => {
    if (!planData || !planData.todoList || planData.todoList.length === 0) return null;
    return planData.todoList[selectedDay - 1] || planData.todoList[0];
  };

  const updateProgress = () => {
    if (!planData) return;

    const dayData = getCurrentDayData();
    if (!dayData) return;

    // Update meal progress
    const meals = [dayData.breakfast, dayData.lunch, dayData.dinner];
    const completedMealsCount = meals.filter((meal) => meal.isDone).length;
    setCompletedMeals(completedMealsCount);
    setTotalMeals(3);

    // Update exercise progress
    if (dayData.exercise && dayData.exercise.exercises) {
      const completedExercisesCount = dayData.exercise.exercises.filter(
        (ex: Exercise) => ex.isDone
      ).length;
      setCompletedExercises(completedExercisesCount);
      setTotalExercises(dayData.exercise.exercises.length);
    }
  };

  const toggleMealStatus = async (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    if (!planData) return;

    try {
      const token = await SecureStore.getItemAsync('access_token');
      const userId = await SecureStore.getItemAsync('user_id');

      if (!token || !userId) {
        console.error('No token found');
        return;
      }

      const dayData = getCurrentDayData();
      if (!dayData) return;

      const currentMeal = dayData[mealType];
      const newStatus = !currentMeal.isDone;

      // Update local state optimistically
      const updatedPlanData = { ...planData };
      const dayIndex = updatedPlanData.todoList.findIndex((day) => day.day === selectedDay);
      if (dayIndex !== -1) {
        updatedPlanData.todoList[dayIndex][mealType].isDone = newStatus;
        setPlanData(updatedPlanData);
        updateProgress();
      }

      // TODO: Make API call to update meal status on server
      console.log(`🔄 Toggling ${mealType} status to:`, newStatus);

      // API call to update meal status
      const response = await fetch(
        `https://api-fitemeal.vercel.app/api/meal-exercise-plans/${userId}/meals/${mealType}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            day: selectedDay,
            isDone: newStatus,
          }),
        }
      );

      if (!response.ok) {
        console.error('❌ Failed to update meal status');
        // Revert local state if API call fails
        updatedPlanData.todoList[dayIndex][mealType].isDone = !newStatus;
        setPlanData(updatedPlanData);
        updateProgress();
      }
    } catch (error) {
      console.error('❌ Error toggling meal status:', error);
    }
  };

  const toggleExerciseStatus = async (exerciseIndex: number) => {
    if (!planData) return;

    try {
      const token = await SecureStore.getItemAsync('access_token');
      const userId = await SecureStore.getItemAsync('user_id');

      if (!token || !userId) {
        console.error('No token found');
        return;
      }

      const dayData = getCurrentDayData();
      if (!dayData || !dayData.exercise) return;

      const currentExercise = dayData.exercise.exercises[exerciseIndex];
      const newStatus = !currentExercise.isDone;

      // Update local state optimistically
      const updatedPlanData = { ...planData };
      const dayIndex = updatedPlanData.todoList.findIndex((day) => day.day === selectedDay);
      if (dayIndex !== -1) {
        updatedPlanData.todoList[dayIndex].exercise.exercises[exerciseIndex].isDone = newStatus;
        setPlanData(updatedPlanData);
        updateProgress();
      }

      // TODO: Make API call to update exercise status on server
      console.log(`🔄 Toggling exercise ${exerciseIndex} status to:`, newStatus);

      // API call to update exercise status
      const response = await fetch(
        `https://api-fitemeal.vercel.app/api/meal-exercise-plans/${userId}/exercises/${exerciseIndex}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            day: selectedDay,
            isDone: newStatus,
          }),
        }
      );

      if (!response.ok) {
        console.error('❌ Failed to update exercise status');
        // Revert local state if API call fails
        updatedPlanData.todoList[dayIndex].exercise.exercises[exerciseIndex].isDone = !newStatus;
        setPlanData(updatedPlanData);
        updateProgress();
      }
    } catch (error) {
      console.error('❌ Error toggling exercise status:', error);
    }
  };

  const renderMealCard = (meal: MealData, mealType: string, icon: string) => {
    const mealTypeKey = mealType.toLowerCase() as 'breakfast' | 'lunch' | 'dinner';

    return (
      <TouchableOpacity
        style={styles.mealCard}
        key={mealType}
        onPress={() => toggleMealStatus(mealTypeKey)}
        activeOpacity={0.7}>
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleRow}>
            <Text style={styles.mealIcon}>{icon}</Text>
            <Text style={styles.mealType}>{mealType}</Text>
          </View>
          <TouchableOpacity
            style={[styles.statusBadge, meal.isDone && styles.statusBadgeCompleted]}
            onPress={() => toggleMealStatus(mealTypeKey)}>
            <Ionicons
              name={meal.isDone ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={meal.isDone ? '#FFFFFF' : '#6B7280'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.statusText, meal.isDone && styles.statusTextCompleted]}>
              {meal.isDone ? 'Done' : 'Pending'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.mealName}>{meal.name}</Text>
        <Text style={styles.mealCalories}>{meal.calories} calories</Text>
      </TouchableOpacity>
    );
  };

  const renderExerciseCard = (exercise: Exercise, index: number) => {
    return (
      <TouchableOpacity
        style={styles.exerciseCard}
        key={index}
        onPress={() => toggleExerciseStatus(index)}
        activeOpacity={0.7}>
        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <TouchableOpacity
            style={[styles.statusBadge, exercise.isDone && styles.statusBadgeCompleted]}
            onPress={() => toggleExerciseStatus(index)}>
            <Ionicons
              name={exercise.isDone ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={exercise.isDone ? '#FFFFFF' : '#6B7280'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.statusText, exercise.isDone && styles.statusTextCompleted]}>
              {exercise.isDone ? 'Done' : 'Pending'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.exerciseDetails}>
          {exercise.sets} sets × {exercise.reps}
        </Text>
        <Text style={styles.exerciseTarget}>Target: {exercise.targetMuscle}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading your plan...</Text>
      </View>
    );
  }

  if (!planData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#8B0000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meal & Exercise Plan</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No meal & exercise plan found</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('PlanSelection')}>
            <Text style={styles.createButtonText}>Create New Plan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const dayData = getCurrentDayData();
  const mealProgressPercentage = totalMeals > 0 ? (completedMeals / totalMeals) * 100 : 0;
  const exerciseProgressPercentage =
    totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#8B0000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meal & Exercise Plan</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Plan Info */}
        <View style={styles.planInfo}>
          <Text style={styles.planName}>{planData.name}</Text>
          <Text style={styles.planGoal}>Goal: {planData.goal}</Text>
          <Text style={styles.planDuration}>Duration: {planData.duration} days</Text>
        </View>

        {/* Progress Cards */}
        <View style={styles.progressContainer}>
          {/* Meal Progress */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Meals</Text>
              <Text style={styles.progressCount}>
                {completedMeals}/{totalMeals}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    { backgroundColor: '#10B981', width: `${mealProgressPercentage}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {mealProgressPercentage.toFixed(0)}% completed
              </Text>
            </View>
            <Text style={styles.mealsCompleted}>
              {dayData?.dailyCalories || 0} calories planned
            </Text>
          </View>

          {/* Exercise Progress */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Exercises</Text>
              <Text style={styles.progressCount}>
                {completedExercises}/{totalExercises}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    { backgroundColor: '#F59E0B', width: `${exerciseProgressPercentage}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {exerciseProgressPercentage.toFixed(0)}% completed
              </Text>
            </View>
            <Text style={styles.mealsCompleted}>
              {dayData?.exercise?.caloriesBurned || 0} calories to burn
            </Text>
          </View>
        </View>

        {/* Day Selector */}
        {planData && planData.todoList.length > 1 && (
          <View style={styles.daySelector}>
            <Text style={styles.sectionTitle}>Select Day</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dayScrollView}>
              {planData.todoList.map((day, index) => (
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

        {/* Meals Section */}
        <View style={styles.mealsSection}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          {dayData && (
            <View style={styles.mealsList}>
              {renderMealCard(dayData.breakfast, 'Breakfast', '☀️')}
              {renderMealCard(dayData.lunch, 'Lunch', '🌞')}
              {renderMealCard(dayData.dinner, 'Dinner', '🌙')}
            </View>
          )}
        </View>

        {/* Exercise Section */}
        <View style={styles.exerciseSection}>
          <Text style={styles.sectionTitle}>Today's Exercises</Text>
          {dayData && dayData.exercise && (
            <View style={styles.exerciseContainer}>
              <View style={styles.exerciseOverview}>
                <Text style={styles.exerciseSessionName}>{dayData.exercise.exerciseName}</Text>
                <Text style={styles.exerciseSessionDuration}>{dayData.exercise.totalSession}</Text>
                <Text style={styles.exerciseCalories}>
                  {dayData.exercise.caloriesBurned} calories
                </Text>
              </View>
              <View style={styles.exercisesList}>
                {dayData.exercise.exercises.map((exercise, index) =>
                  renderExerciseCard(exercise, index)
                )}
              </View>
            </View>
          )}
        </View>
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
  planInfo: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  planGoal: {
    fontSize: 16,
    color: '#8B0000',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  planDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  progressCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  mealsCompleted: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  daySelector: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  dayScrollView: {
    flexDirection: 'row',
  },
  dayButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  mealsSection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  mealsList: {
    gap: 12,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
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
    marginBottom: 8,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeCompleted: {
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusTextCompleted: {
    color: '#FFFFFF',
  },
  mealName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  mealCalories: {
    fontSize: 12,
    color: '#6B7280',
  },
  exerciseSection: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  exerciseContainer: {
    gap: 12,
  },
  exerciseOverview: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  exercisesList: {
    gap: 8,
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
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
  },
});
