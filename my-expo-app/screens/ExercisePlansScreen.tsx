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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';
import { useNavigation } from '@react-navigation/native';
import { updateExerciseStatus } from '../services/mealPlanService';

// Interface untuk individual exercise dalam exercises array
interface IndividualExercise {
  name: string;
  sets: number;
  reps: string;
  targetMuscle: string;
  equipment: string;
  isDone: boolean;
}

// Interface untuk exercise data yang diupdate sesuai struktur baru
interface ExerciseData {
  day: number;
  date: string;
  exercise: {
    exerciseName: string;
    totalSession: string;
    exercises: IndividualExercise[];
    caloriesBurned: number;
    notes: string;
    isDone: boolean;
  };
}

// Interface untuk exercise plan data
interface ExercisePlanData {
  _id: string;
  name: string;
  userId: string;
  startDate: string;
  endDate: string;
  todoList: ExerciseData[];
  isDone: boolean;
  createdAt: string;
  updatedAt: string;
}

// Helper function to safely get exercise data with robust key handling
const safeGetExerciseProperty = (exercise: any, property: string, fallback: any = '') => {
  if (!exercise) return fallback;

  // Handle different possible key variations
  switch (property) {
    case 'exerciseName':
      return exercise.exerciseName || exercise.excerciseName || exercise.name || 'Unknown Exercise';
    case 'caloriesBurned':
      return exercise.caloriesBurned || exercise.calories || 0;
    case 'isDone':
      return exercise.isDone || exercise.completed || false;
    case 'totalSession':
      return exercise.totalSession || exercise.sessions || exercise.duration || 'N/A';
    case 'notes':
      return exercise.notes || exercise.note || '';
    default:
      return exercise[property] || fallback;
  }
};

// Helper function to normalize exercise plan data from API
const normalizeExercisePlanData = (planData: any): ExercisePlanData => {
  const normalizedPlan = { ...planData };

  if (normalizedPlan.todoList && Array.isArray(normalizedPlan.todoList)) {
    normalizedPlan.todoList = normalizedPlan.todoList.map((dayData: any) => {
      const normalizedDay = { ...dayData };

      // Handle the exercise data structure
      if (dayData.exercise) {
        // Data is already in the expected structure
        normalizedDay.exercise = {
          exerciseName: safeGetExerciseProperty(dayData.exercise, 'exerciseName'),
          totalSession: safeGetExerciseProperty(dayData.exercise, 'totalSession'),
          caloriesBurned: safeGetExerciseProperty(dayData.exercise, 'caloriesBurned'),
          isDone: safeGetExerciseProperty(dayData.exercise, 'isDone'),
          notes: safeGetExerciseProperty(dayData.exercise, 'notes'),
          exercises: dayData.exercise.exercises || [],
        };
      } else {
        // Transform flat structure to nested structure
        normalizedDay.exercise = {
          exerciseName: safeGetExerciseProperty(dayData, 'exerciseName'),
          totalSession: safeGetExerciseProperty(dayData, 'totalSession'),
          caloriesBurned: safeGetExerciseProperty(dayData, 'caloriesBurned'),
          isDone: safeGetExerciseProperty(dayData, 'isDone'),
          notes: safeGetExerciseProperty(dayData, 'notes'),
          exercises: [], // This might need to be populated differently based on API structure
        };
      }

      return normalizedDay;
    });
  }

  return normalizedPlan;
};

export default function ExercisePlansScreen() {
  const navigation = useNavigation();

  const [plans, setPlans] = useState<ExercisePlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [ongoingPlans, setOngoingPlans] = useState<ExercisePlanData[]>([]);
  const [upcomingPlans, setUpcomingPlans] = useState<ExercisePlanData[]>([]);
  const [activeTab, setActiveTab] = useState<'ongoing' | 'upcoming'>('ongoing');
  const [exerciseNotes, setExerciseNotes] = useState<{ [key: string]: string }>({});
  const [updatingExercise, setUpdatingExercise] = useState<string | null>(null);

  // Update exercise completion status
  const updateExerciseStatusLocal = useCallback(
    async (planId: string, day: number, isDone: boolean, notes: string) => {
      try {
        setUpdatingExercise(`${day}`);

        // Gunakan service untuk update status
        await updateExerciseStatus(planId, day, isDone, notes);

        // Update local state dengan struktur baru
        const updatePlans = (prevPlans: ExercisePlanData[]) =>
          prevPlans.map((plan) => {
            if (plan._id === planId) {
              return {
                ...plan,
                todoList: plan.todoList.map((exerciseData) => {
                  if (exerciseData.day === day) {
                    return {
                      ...exerciseData,
                      exercise: {
                        ...exerciseData.exercise,
                        isDone,
                        notes,
                      },
                    };
                  }
                  return exerciseData;
                }),
              };
            }
            return plan;
          });

        setPlans(updatePlans);
        setOngoingPlans(updatePlans);
        setUpcomingPlans(updatePlans);

        // Clear notes input after successful update
        const noteKey = `${selectedPlan}-${day}`;
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

  // Fetch exercise plans
  const fetchExercisePlans = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');

      if (!token) {
        Alert.alert('Error', 'No access token found');
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/excercise`, {
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

      const ongoing = Array.isArray(result.data?.ongoing) ? result.data.ongoing.map(normalizeExercisePlanData) : [];
      const upcoming = Array.isArray(result.data?.upcoming) ? result.data.upcoming.map(normalizeExercisePlanData) : [];

      setOngoingPlans(ongoing);
      setUpcomingPlans(upcoming);
      setPlans([...ongoing, ...upcoming]);

      if (!selectedPlan && ongoing.length > 0) {
        setSelectedPlan(ongoing[0]._id);
      }
    } catch (error) {
      console.error('❌ Error fetching exercise plans:', error);
      Alert.alert('Error', 'Failed to fetch exercise plans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPlan]);

  useEffect(() => {
    fetchExercisePlans();
  }, [fetchExercisePlans]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchExercisePlans();
  }, [fetchExercisePlans]);

  const currentPlan = plans.find((plan) => plan._id === selectedPlan);
  const currentExercise = currentPlan?.todoList.find((exercise) => exercise.day === selectedDay);

  // Handle plan selection
  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setSelectedDay(1);
  };

  // Handle exercise completion toggle
  const handleExerciseToggle = async () => {
    if (!selectedPlan || !currentExercise) return;

    const noteKey = `${selectedPlan}-${selectedDay}`;
    const notes = exerciseNotes[noteKey] || currentExercise.exercise.notes || '';

    await updateExerciseStatusLocal(selectedPlan, selectedDay, !safeGetExerciseProperty(currentExercise.exercise, 'isDone'), notes);
  };

  // Get notes for a specific exercise
  const getExerciseNotes = () => {
    const noteKey = `${selectedPlan}-${selectedDay}`;
    return exerciseNotes[noteKey] || currentExercise?.exercise.notes || '';
  };

  // Set notes for a specific exercise
  const setExerciseNotesForDay = (notes: string) => {
    const noteKey = `${selectedPlan}-${selectedDay}`;
    setExerciseNotes((prev) => ({
      ...prev,
      [noteKey]: notes,
    }));
  };

  // Render exercise detail
  const renderExerciseDetail = (exercise: ExerciseData) => {
    const isUpdating = updatingExercise === `${selectedDay}`;
    const noteValue = getExerciseNotes();

    return (
      <View style={styles.exerciseDetailCard}>
        <View style={styles.exerciseDetailHeader}>
          <View style={styles.exerciseTypeRow}>
            <Text style={styles.exerciseTypeIcon}>💪</Text>
            <Text style={styles.exerciseTypeText}>Exercise</Text>
          </View>
          <Text style={styles.caloriesText}>
            {safeGetExerciseProperty(exercise.exercise, 'caloriesBurned')} burn cal
          </Text>
        </View>

        {/* Exercise Name with Mark as Complete Button */}
        <View style={styles.exerciseNameContainer}>
          <Text style={styles.exerciseName}>
            {safeGetExerciseProperty(exercise.exercise, 'exerciseName')}
          </Text>
          <TouchableOpacity
            style={[
              styles.exerciseCompleteButton,
              safeGetExerciseProperty(exercise.exercise, 'isDone') && styles.exerciseCompleteButtonDone,
              isUpdating && styles.exerciseCompleteButtonDisabled,
            ]}
            onPress={handleExerciseToggle}
            disabled={isUpdating}>
            {isUpdating ? (
              <ActivityIndicator size="small" color={safeGetExerciseProperty(exercise.exercise, 'isDone') ? '#FFFFFF' : '#666666'} />
            ) : (
              <Text
                style={[
                  styles.exerciseCompleteButtonText,
                  safeGetExerciseProperty(exercise.exercise, 'isDone') && styles.exerciseCompleteButtonTextDone,
                ]}>
                {safeGetExerciseProperty(exercise.exercise, 'isDone') ? '✓' : '○'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.exerciseInfoGrid}>
          <View style={styles.exerciseInfoItem}>
            <Text style={styles.exerciseInfoLabel}>Duration</Text>
            <Text style={styles.exerciseInfoValue}>{exercise.exercise.totalSession}</Text>
          </View>
          <View style={styles.exerciseInfoItem}>
            <Text style={styles.exerciseInfoLabel}>Total Exercises</Text>
            <Text style={styles.exerciseInfoValue}>{exercise.exercise.exercises.length}</Text>
          </View>
          <View style={styles.exerciseInfoItem}>
            <Text style={styles.exerciseInfoLabel}>Burned Calories</Text>
            <Text style={styles.exerciseInfoValue}>
              {safeGetExerciseProperty(exercise.exercise, 'caloriesBurned')}
            </Text>
          </View>
          <View style={styles.exerciseInfoItem}>
            <Text style={styles.exerciseInfoLabel}>Status</Text>
            <Text style={[
              styles.exerciseInfoValue,
              { color: safeGetExerciseProperty(exercise.exercise, 'isDone') ? '#4CAF50' : '#FF5722' }
            ]}>
              {safeGetExerciseProperty(exercise.exercise, 'isDone') ? 'Completed' : 'Pending'}
            </Text>
          </View>
        </View>

        {/* Individual Exercises List - Display Only */}
        <Text style={styles.sectionTitle}>Exercises:</Text>
        <View style={styles.individualExercisesContainer}>
          {exercise.exercise.exercises.map((individualExercise, index) => (
            <View key={index} style={styles.individualExerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.individualExerciseName}>{individualExercise.name}</Text>
                <View style={[
                  styles.exerciseStatusBadge,
                  { backgroundColor: safeGetExerciseProperty(exercise.exercise, 'isDone') ? '#4CAF50' : '#FFA726' }
                ]}>
                  <Text style={styles.exerciseStatusText}>
                    {safeGetExerciseProperty(exercise.exercise, 'isDone') ? '✓' : '○'}
                  </Text>
                </View>
              </View>
              <View style={styles.exerciseDetails}>
                <Text style={styles.exerciseDetailText}>
                  {individualExercise.sets} sets × {individualExercise.reps}
                </Text>
                <Text style={styles.exerciseDetailText}>
                  Target: {individualExercise.targetMuscle}
                </Text>
                <Text style={styles.exerciseDetailText}>
                  Equipment: {individualExercise.equipment}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Notes Input */}
        <Text style={styles.sectionTitle}>Notes:</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Add your workout notes here..."
          value={noteValue}
          onChangeText={setExerciseNotesForDay}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={styles.loadingText}>Loading your exercise plans...</Text>
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

        <Text style={styles.headerTitle}>Exercise Plans</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF9800']}
            tintColor="#FF9800"
          />
        }>
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ongoing' && styles.activeTab]}
            onPress={() => setActiveTab('ongoing')}>
            <Text style={[styles.tabText, activeTab === 'ongoing' && styles.activeTabText]}>
              Ongoing ({ongoingPlans.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
            onPress={() => setActiveTab('upcoming')}>
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
              Upcoming ({upcomingPlans.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Select Exercise Plan Section */}
        <Text style={styles.sectionHeader}>Select Exercise Plan</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.plansScrollContent}
          style={styles.plansScrollContainer}>
          {(activeTab === 'ongoing' ? ongoingPlans : upcomingPlans).map((plan) => {
            const isSelected = selectedPlan === plan._id;
            const startDate = new Date(plan.startDate);
            const endDate = new Date(plan.endDate);

            return (
              <TouchableOpacity
                key={plan._id}
                style={[styles.planCard, isSelected && styles.selectedPlanCard]}
                onPress={() => handlePlanSelect(plan._id)}>
                <View style={styles.planCardContent}>
                  <Text style={[styles.planTitle, isSelected && styles.selectedPlanTitle]}>
                    {plan.name}
                  </Text>
                  <Text style={[styles.planDate, isSelected && styles.selectedPlanDate]}>
                    {startDate.toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    -{' '}
                    {endDate.toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={[styles.planDuration, isSelected && styles.selectedPlanDuration]}>
                    {plan.todoList.length} days program
                  </Text>
                </View>

                {isSelected && (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>Sedang Berjalan</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Select Day Section */}
        {selectedPlan && (
          <>
            <Text style={styles.sectionHeader}>Select Day</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayScrollContent}>
              {currentPlan?.todoList.map((exercise) => {
                const dayDate = new Date(exercise.date);
                const isSelected = selectedDay === exercise.day;

                return (
                  <TouchableOpacity
                    key={exercise.day}
                    style={[styles.dayCard, isSelected && styles.selectedDayCard]}
                    onPress={() => setSelectedDay(exercise.day)}>
                    <Text style={[styles.dayTitle, isSelected && styles.selectedDayTitle]}>
                      Day {exercise.day}
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
                      {safeGetExerciseProperty(exercise.exercise, 'caloriesBurned')} burn cal
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Day Exercise Section */}
            {currentExercise && (
              <>
                <Text style={styles.sectionHeader}>
                  Day {selectedDay} Exercise ({safeGetExerciseProperty(currentExercise.exercise, 'caloriesBurned')} calories)
                </Text>

                {renderExerciseDetail(currentExercise)}
              </>
            )}
          </>
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
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
    height: 40,
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
    color: '#FF9800',
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
  plansScrollContainer: {
    marginBottom: 20,
  },
  plansScrollContent: {
    paddingRight: 20,
    gap: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    minWidth: 280,
    width: 280,
  },
  selectedPlanCard: {
    borderColor: '#FF9800',
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
    color: '#FF9800',
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
  statusBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#FF9800',
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
    borderColor: '#FF9800',
    backgroundColor: '#FFF8F0',
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  selectedDayTitle: {
    color: '#FF9800',
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
    color: '#FF9800',
    fontWeight: '600',
  },
  selectedDayCalories: {
    color: '#FF9800',
  },

  // Exercise Detail Cards
  exerciseDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  exerciseDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseTypeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  exerciseTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9800',
  },
  caloriesText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },

  // Exercise Name Container Styles
  exerciseNameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },

  // Exercise Complete Button Styles (small, on exercise name)
  exerciseCompleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  exerciseCompleteButtonDone: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  exerciseCompleteButtonDisabled: {
    opacity: 0.6,
  },
  exerciseCompleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  exerciseCompleteButtonTextDone: {
    color: '#FFFFFF',
  },

  // Exercise Info Grid
  exerciseInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 12,
  },
  exerciseInfoItem: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
  },
  exerciseInfoLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 4,
  },
  exerciseInfoValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    marginTop: 8,
  },
  targetMuscles: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
    fontStyle: 'italic',
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

  // Individual Exercises Styles
  individualExercisesContainer: {
    marginBottom: 16,
  },
  individualExerciseCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  individualExerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  exerciseStatusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  exerciseDetails: {
    gap: 4,
  },
  exerciseDetailText: {
    fontSize: 12,
    color: '#666666',
  },
});
