import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
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
        return;
      }

      // Fetch meal & exercise plan from API
      const response = await fetch(`https://api-fitemeal.vercel.app/api/meal-exercise-plans/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

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
      }

    } catch (error) {
      console.error('❌ Error loading plan data:', error);
      
      // For development - show mock data if API fails
      console.log('🔄 Using mock data for development...');
      const mockPlanData: PlanData = {
        name: 'Sample Meal & Exercise Plan',
        userId: userId || '685d5b7069b097db95881597',
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
        todoList: [
          {
            day: 1,
            date: '2026-12-30',
            dailyCalories: 2379,
            breakfast: {
              name: 'Nasi Merah Pecel',
              imageUrl: '',
              calories: 595,
              ingredients: [
                '100g beras merah',
                '70g sayuran rebus (kacang panjang, bayam, tauge)',
                '30g tempe goreng',
                '30g tahu rebus',
                '30g sambal pecel',
              ],
              recipes: [
                'Masak beras merah hingga matang.',
                'Rebus aneka sayuran.',
                'Goreng tempe, rebus tahu.',
                'Susun nasi, sayuran, tempe, tahu lalu siram sambal pecel.',
              ],
              isDone: false,
              notes: 'Gunakan sambal pecel secukupnya agar kalori tetap terkontrol.',
            },
            lunch: {
              name: 'Nasi Merah Ayam Bakar Taliwang & Lalap',
              imageUrl: '',
              calories: 835,
              ingredients: [
                '130g beras merah',
                '100g ayam dada tanpa kulit',
                '25g sambal taliwang',
                '70g lalapan (timun, kol, tomat)',
                '1 sdt minyak zaitun',
              ],
              recipes: [
                'Marinasi ayam dengan bumbu taliwang dan bakar hingga matang.',
                'Masak nasi merah.',
                'Siapkan lalapan.',
                'Sajikan ayam bakar, nasi merah, dan lalapan.',
              ],
              isDone: true,
              notes: 'Pilih dada ayam tanpa kulit untuk memangkas lemak.',
            },
            dinner: {
              name: 'Nasi Merah Sup Ikan & Sayur',
              imageUrl: '',
              calories: 950,
              ingredients: [
                '120g beras merah',
                '130g fillet ikan kakap',
                '1 wortel',
                '60g buncis',
                '2 siung bawang putih',
                '1 batang daun bawang',
                '1 sdt garam',
                'Air dan rempah secukupnya',
              ],
              recipes: [
                'Masak beras merah.',
                'Masak ikan bersama wortel, buncis, bawang dan daun bawang dalam air hingga menjadi sup.',
                'Sajikan nasi merah dengan sup ikan dan sayuran.',
              ],
              isDone: true,
              notes: 'Protein tinggi, cocok untuk after workout dinner.',
            },
            exercise: {
              exerciseName: 'Upper Body Strength with Dumbbells',
              totalSession: '45 menit',
              exercises: [
                {
                  name: 'Dumbbell Chest Press',
                  sets: 3,
                  reps: '12',
                  targetMuscle: 'dada, triceps',
                  equipment: 'dumbbells, yoga mat',
                  isDone: true,
                },
                {
                  name: 'Dumbbell Row',
                  sets: 3,
                  reps: '12 tiap sisi',
                  targetMuscle: 'punggung, biceps',
                  equipment: 'dumbbells',
                  isDone: true,
                },
                {
                  name: 'Shoulder Press',
                  sets: 3,
                  reps: '12',
                  targetMuscle: 'bahu',
                  equipment: 'dumbbells',
                  isDone: false,
                },
                {
                  name: 'Treadmill Jogging',
                  sets: 1,
                  reps: '15 menit',
                  targetMuscle: 'kardio',
                  equipment: 'treadmill',
                  isDone: false,
                },
              ],
              caloriesBurned: 360,
              notes: 'Istirahat 60 detik antar set. Fokus teknik!',
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

  const toggleMealStatus = async (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    if (!planData) return;

    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
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
    } catch (error) {
      console.error('❌ Error toggling meal status:', error);
    }
  };

  const toggleExerciseStatus = async (exerciseIndex: number) => {
    if (!planData) return;

    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
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
    } catch (error) {
      console.error('❌ Error toggling exercise status:', error);
    }
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading your plan...</Text>
      </View>
    );
  }

  const dayData = getCurrentDayData();
  const progressPercentage = totalMeals > 0 ? (completedMeals / totalMeals) * 100 : 0;
  const exerciseProgressPercentage =
    totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{planData?.name || 'Meal & Exercise Plan'}</Text>
          <View style={styles.menuButton} />
        </View>

        {/* Plan Info */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Day {selectedDay} Progress</Text>
          <Text style={styles.subtitle}>
            {dayData?.date ? new Date(dayData.date).toLocaleDateString() : 'Track your daily goals'}
          </Text>
        </View>

        {/* Progress Cards */}
        <View style={styles.calorieCardsContainer}>
          {/* Meal Progress Card */}
          <View style={styles.calorieCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="restaurant" size={20} color="#22C55E" />
              </View>
              <Text style={styles.cardLabel}>Meal Progress</Text>
            </View>
            <Text style={styles.calorieNumber}>
              {completedMeals}/{totalMeals}
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
              </View>
              <Text style={styles.progressText}>{progressPercentage.toFixed(0)}% completed</Text>
            </View>
            <Text style={styles.mealsCompleted}>
              {dayData?.dailyCalories || 0} calories planned
            </Text>
          </View>

          {/* Exercise Progress Card */}
          <View style={styles.calorieCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="fitness" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.cardLabel}>Exercise Progress</Text>
            </View>
            <Text style={[styles.calorieNumber, { color: '#F59E0B' }]}>
              {completedExercises}/{totalExercises}
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
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
          <Text style={styles.sectionTitle}>Today's Workout</Text>
          {dayData?.exercise && (
            <View style={styles.exerciseContainer}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseTitle}>{dayData.exercise.exerciseName}</Text>
                <Text style={styles.exerciseDuration}>{dayData.exercise.totalSession}</Text>
              </View>
              <Text style={styles.exerciseNotes}>{dayData.exercise.notes}</Text>
              <View style={styles.exercisesList}>
                {dayData.exercise.exercises.map((exercise, index) =>
                  renderExerciseCard(exercise, index)
                )}
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('BerandaNavigator', { screen: 'Add' })}
            activeOpacity={0.8}>
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              <View style={styles.actionContent}>
                <View style={styles.actionIcon}>
                  <Ionicons name="add" size={28} color="white" />
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>Create New Plan</Text>
                  <Text style={styles.actionDescription}>Plan your next goals</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    backgroundColor: 'white',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  calorieCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 25,
  },
  calorieCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  calorieNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#22C55E',
    marginBottom: 15,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  mealsCompleted: {
    fontSize: 12,
    color: '#64748B',
  },
  goalContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  goalLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    marginBottom: 4,
  },
  remainingText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 15,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  actionGradient: {
    padding: 20,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  // Add missing styles for meal and exercise plan display
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  daySelector: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  dayScrollView: {
    paddingRight: 20,
  },
  dayButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  dayButtonSelected: {
    backgroundColor: '#8B0000',
    borderColor: '#8B0000',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  dayButtonTextSelected: {
    color: 'white',
  },
  mealsSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  mealsList: {
    gap: 12,
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
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
    color: '#1E293B',
  },
  statusBadge: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeCompleted: {
    backgroundColor: '#DCFCE7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#DC2626',
  },
  statusTextCompleted: {
    color: '#16A34A',
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  mealCalories: {
    fontSize: 14,
    color: '#64748B',
  },
  exerciseSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  exerciseContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
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
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  exerciseDuration: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B0000',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  exerciseNotes: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  exercisesList: {
    gap: 8,
  },
  exerciseCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#8B0000',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  exerciseTarget: {
    fontSize: 12,
    color: '#8B0000',
    marginTop: 2,
    fontWeight: '500',
  },
});
