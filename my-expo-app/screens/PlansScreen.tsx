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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_URL = 'https://fh8mlxkf-3000.asse.devtunnels.ms';

type PlansScreenProps = {
  onNavigate: (screen: string) => void;
};

// Interface untuk meal data
interface MealData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isDone: boolean;
  notes?: string;
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

export default function PlansScreen({ onNavigate }: PlansScreenProps) {
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [ongoingPlans, setOngoingPlans] = useState<PlanData[]>([]);
  const [upcomingPlans, setUpcomingPlans] = useState<PlanData[]>([]);
  const [activeTab, setActiveTab] = useState<'ongoing' | 'upcoming'>('ongoing');
  const [mealNotes, setMealNotes] = useState<{[key: string]: string}>({});
  const [updatingMeal, setUpdatingMeal] = useState<string | null>(null);

  // Update meal completion status
  const updateMealStatus = useCallback(async (planId: string, day: number, type: string, isDone: boolean, notes: string) => {
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
        notes
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
      setPlans(prevPlans => 
        prevPlans.map(plan => {
          if (plan._id === planId) {
            return {
              ...plan,
              todoList: plan.todoList.map(dayData => {
                if (dayData.day === day) {
                  return {
                    ...dayData,
                    [type]: {
                      ...dayData[type as keyof Omit<DayData, 'date' | 'day' | 'dailyCalories'>],
                      isDone,
                      notes
                    }
                  };
                }
                return dayData;
              })
            };
          }
          return plan;
        })
      );

      setOngoingPlans(prevPlans => 
        prevPlans.map(plan => {
          if (plan._id === planId) {
            return {
              ...plan,
              todoList: plan.todoList.map(dayData => {
                if (dayData.day === day) {
                  return {
                    ...dayData,
                    [type]: {
                      ...dayData[type as keyof Omit<DayData, 'date' | 'day' | 'dailyCalories'>],
                      isDone,
                      notes
                    }
                  };
                }
                return dayData;
              })
            };
          }
          return plan;
        })
      );

      setUpcomingPlans(prevPlans => 
        prevPlans.map(plan => {
          if (plan._id === planId) {
            return {
              ...plan,
              todoList: plan.todoList.map(dayData => {
                if (dayData.day === day) {
                  return {
                    ...dayData,
                    [type]: {
                      ...dayData[type as keyof Omit<DayData, 'date' | 'day' | 'dailyCalories'>],
                      isDone,
                      notes
                    }
                  };
                }
                return dayData;
              })
            };
          }
          return plan;
        })
      );

      // Clear notes input after successful update
      const noteKey = `${selectedPlan}-${day}-${type}`;
      setMealNotes(prev => ({
        ...prev,
        [noteKey]: ''
      }));

      Alert.alert('Success', `${type.charAt(0).toUpperCase() + type.slice(1)} marked as ${isDone ? 'completed' : 'incomplete'}!`);

    } catch (error) {
      console.error('❌ Error updating meal status:', error);
      Alert.alert('Error', 'Failed to update meal status. Please try again.');
    } finally {
      setUpdatingMeal(null);
    }
  }, [selectedPlan]);

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

      const ongoing = Array.isArray(result.data?.ongoing) ? result.data.ongoing : [];
      const upcoming = Array.isArray(result.data?.upcoming) ? result.data.upcoming : [];

      setOngoingPlans(ongoing);
      setUpcomingPlans(upcoming);
      setPlans([...ongoing, ...upcoming]);

      if (!selectedPlan && ongoing.length > 0) {
        setSelectedPlan(ongoing[0]._id);
      }
    } catch (error) {
      console.error('❌ Error fetching meal plans:', error);
      Alert.alert('Error', 'Failed to fetch meal plans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPlan]);

  useEffect(() => {
    fetchMealPlans();
  }, [fetchMealPlans]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMealPlans();
  }, [fetchMealPlans]);

  const currentPlan = plans.find((plan) => plan._id === selectedPlan);
  const currentDay = currentPlan?.todoList.find((day) => day.day === selectedDay);

  // Handle plan selection
  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setSelectedDay(1);
  };

  // Handle meal completion toggle
  const handleMealToggle = async (mealType: string) => {
    if (!selectedPlan || !currentDay) return;

    const meal = currentDay[mealType as keyof Omit<DayData, 'date' | 'day' | 'dailyCalories'>] as MealData;
    const noteKey = `${selectedPlan}-${selectedDay}-${mealType}`;
    const notes = mealNotes[noteKey] || meal.notes || '';

    await updateMealStatus(selectedPlan, selectedDay, mealType, !meal.isDone, notes);
  };

  // Get notes for a specific meal
  const getMealNotes = (mealType: string) => {
    const noteKey = `${selectedPlan}-${selectedDay}-${mealType}`;
    return mealNotes[noteKey] || currentDay?.[mealType as keyof Omit<DayData, 'date' | 'day' | 'dailyCalories'>]?.notes || '';
  };

  // Set notes for a specific meal
  const setMealNotesForType = (mealType: string, notes: string) => {
    const noteKey = `${selectedPlan}-${selectedDay}-${mealType}`;
    setMealNotes(prev => ({
      ...prev,
      [noteKey]: notes
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
          <Text style={styles.ingredientItem}>• 100g beras</Text>
          <Text style={styles.ingredientItem}>• 1 lembar daun salam</Text>
          <Text style={styles.ingredientItem}>• 100ml santan</Text>
          <Text style={styles.ingredientItem}>• 1 butir telur ayam</Text>
          <Text style={styles.ingredientItem}>• 1 sdt garam</Text>
          <Text style={styles.ingredientItem}>• 1 sdm minyak goreng</Text>
          <Text style={styles.ingredientItem}>• 2 iris mentimun</Text>
        </View>

        <Text style={styles.sectionTitle}>Recipe:</Text>
        <View style={styles.recipeList}>
          <Text style={styles.recipeStep}>
            1. Cuci bersih beras, lalu masukkan ke dalam rice cooker.
          </Text>
          <Text style={styles.recipeStep}>
            2. Tambahkan santan, daun salam, dan garam, lalu masak hingga matang.
          </Text>
          <Text style={styles.recipeStep}>
            3. Kocok telur dengan sedikit garam dan goreng dalam wajan hingga matang.
          </Text>
          <Text style={styles.recipeStep}>
            4. Sajikan nasi uduk dengan telur dadar dan irisan mentimun.
          </Text>
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
              isUpdating && styles.statusButtonDisabled
            ]}
            onPress={() => handleMealToggle(mealType)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={meal.isDone ? "#FFFFFF" : "#666666"} />
                <Text style={[styles.statusButtonText, meal.isDone && styles.statusButtonTextCompleted]}>
                  Updating...
                </Text>
              </View>
            ) : (
              <Text style={[styles.statusButtonText, meal.isDone && styles.statusButtonTextCompleted]}>
                {meal.isDone ? 'Completed' : 'Mark as Complete'}
              </Text>
            )}
          </TouchableOpacity>
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
        <TouchableOpacity onPress={() => onNavigate('Home')} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Meal Plans</Text>

        <TouchableOpacity style={styles.addButton} onPress={() => onNavigate('Add')}>
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

        {/* Select Meal Plan Section */}
        <Text style={styles.sectionHeader}>Select Meal Plan</Text>

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
                  {plan.duration} days
                </Text>

                {isSelected && (
                  <TouchableOpacity
                    style={styles.uploadPhotoButton}
                    onPress={() => onNavigate('UploadImageScreen')}>
                    <Text style={styles.uploadPhotoIcon}>📷</Text>
                    <Text style={styles.uploadPhotoText}>Upload Photo</Text>
                  </TouchableOpacity>
                )}
              </View>

              {isSelected && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>Sedang Berjalan</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Select Day Section */}
        {selectedPlan && (
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
});
