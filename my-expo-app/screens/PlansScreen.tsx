import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';

interface MealPlan {
  _id: string;
  name: string;
  userId: string;
  startDate: string;
  endDate: string;
  todoList: DayPlan[];
  createdAt: string;
  updatedAt: string;
}

interface DayPlan {
  day: number;
  date: string;
  dailyCalories: number;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
}

interface Meal {
  name: string;
  imageUrl: string;
  calories: number;
  ingredients: string[];
  recipes: string[];
  isDone: boolean;
  notes: string;
}

interface PlansData {
  ongoing: MealPlan[];
  upcoming: MealPlan[];
}

type PlansScreenProps = {
  onNavigate: (screen: string, params?: any) => void;
};

export default function PlansScreen({ onNavigate }: PlansScreenProps) {
  const [loading, setLoading] = useState(true);
  const [plansData, setPlansData] = useState<PlansData>({ ongoing: [], upcoming: [] });
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'ongoing' | 'upcoming'>('ongoing');

  useEffect(() => {
    loadMealPlans();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadMealPlans();
    }, [])
  );

  const loadMealPlans = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('access_token');

      if (!token) {
        Alert.alert(
          'Authentication Required',
          'No authentication token found. Please restart the app and login again.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to home instead of login
                onNavigate('Home');
              },
            },
          ]
        );
        return;
      }

      console.log('🔍 Loading meal plans...');
    //   console.log(token, "<<<<<<<<<<<<<<");
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.PREP_MEAL}`, {
        method: 'GET',
        headers: {
          "Content-Type": 'application/json',
          "Authorization": `Bearer ${token}`,
        },
      });
    //   console.log(response, "<<<<<<<<<<<<<<");
      
    //   console.log(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PREP_MEAL}`, "<<<<<<<<<<<<<<");
      
      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please restart the app and login again.',
            [
              {
                text: 'OK',
                // onPress: async () => {
                //   await SecureStore.deleteItemAsync('access_token');
                //   await SecureStore.deleteItemAsync('user_id');
                // },
              },
            ]
          );
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📄 Meal plans response:', result);

      // Handle the new response structure
      const newPlansData: PlansData = {
        ongoing: result.data?.ongoing || [],
        upcoming: result.data?.upcoming || [],
      };
      

      setPlansData(newPlansData);

      // Set default selected plan from ongoing first, then upcoming
      if (newPlansData.ongoing.length > 0) {
        setSelectedPlan(newPlansData.ongoing[0]);
        setSelectedDay(newPlansData.ongoing[0].todoList[0]);
        setActiveTab('ongoing');
      } else if (newPlansData.upcoming.length > 0) {
        setSelectedPlan(newPlansData.upcoming[0]);
        setSelectedDay(newPlansData.upcoming[0].todoList[0]);
        setActiveTab('upcoming');
      } else {
        // No meal plans found
        Alert.alert(
          'No Meal Plan Found',
          "You don't have any meal plans yet. Would you like to create one?",
          [
            {
              text: 'Cancel',
              onPress: () => onNavigate('Home'),
              style: 'cancel',
            },
            {
              text: 'Create Plan',
              onPress: () => onNavigate('Add'),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load meal plans. Please check your internet connection.');
      console.error('❌ Error loading meal plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: 'ongoing' | 'upcoming') => {
    return status === 'ongoing' ? '#10B981' : '#F59E0B';
  };

  const getStatusText = (status: 'ongoing' | 'upcoming') => {
    return status === 'ongoing' ? 'Sedang Berjalan' : 'Akan Datang';
  };

  const handleAlternateNavigation = () => {
    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a meal plan first');
      return;
    }

    console.log('🚀 Navigating to Upload with planId:', selectedPlan._id);
    onNavigate('Upload', { planId: selectedPlan._id, planName: selectedPlan.name });
  };

  const renderTabSelector = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'ongoing' && styles.activeTab]}
        onPress={() => {
          setActiveTab('ongoing');
          if (plansData.ongoing.length > 0) {
            setSelectedPlan(plansData.ongoing[0]);
            setSelectedDay(plansData.ongoing[0].todoList[0]);
          }
        }}>
        <Text style={[styles.tabText, activeTab === 'ongoing' && styles.activeTabText]}>
          Ongoing ({plansData.ongoing.length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
        onPress={() => {
          setActiveTab('upcoming');
          if (plansData.upcoming.length > 0) {
            setSelectedPlan(plansData.upcoming[0]);
            setSelectedDay(plansData.upcoming[0].todoList[0]);
          }
        }}>
        <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
          Upcoming ({plansData.upcoming.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPlanSelector = () => {
    const currentPlans = activeTab === 'ongoing' ? plansData.ongoing : plansData.upcoming;

    if (currentPlans.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>
            {activeTab === 'ongoing' ? 'No ongoing meal plans' : 'No upcoming meal plans'}
          </Text>
          <TouchableOpacity style={styles.createButton} onPress={() => onNavigate('Add')}>
            <Text style={styles.createButtonText}>Create New Plan</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.planSelector}>
        <Text style={styles.sectionTitle}>Select Meal Plan</Text>
        {currentPlans.map((plan) => (
          <TouchableOpacity
            key={plan._id}
            style={[styles.planCard, selectedPlan?._id === plan._id && styles.selectedPlanCard]}
            onPress={() => {
              setSelectedPlan(plan);
              setSelectedDay(plan.todoList[0]);
            }}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activeTab) }]}>
                <Text style={styles.statusText}>{getStatusText(activeTab)}</Text>
              </View>
            </View>
            <Text style={styles.planDate}>
              {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
            </Text>
            <Text style={styles.planDays}>{plan.todoList.length} days</Text>

            {/* Alternate Button - hanya tampil jika plan ini yang selected */}
            {selectedPlan?._id === plan._id && (
              <TouchableOpacity style={styles.alternateButton} onPress={handleAlternateNavigation}>
                <Ionicons name="camera" size={18} color="#8B4A6B" />
                <Text style={styles.alternateButtonText}>Alternate</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderDaySelector = () => {
    if (!selectedPlan) return null;

    return (
      <View style={styles.daySelector}>
        <Text style={styles.sectionTitle}>Select Day</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
          {selectedPlan.todoList.map((day) => (
            <TouchableOpacity
              key={day.day}
              style={[styles.dayCard, selectedDay?.day === day.day && styles.selectedDayCard]}
              onPress={() => setSelectedDay(day)}>
              <Text style={styles.dayNumber}>Day {day.day}</Text>
              <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
              <Text style={styles.dayCalories}>{day.dailyCalories} cal</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderMealDetails = () => {
    if (!selectedDay) return null;

    const meals = [
      { name: 'Breakfast', data: selectedDay.breakfast, icon: 'sunny-outline' },
      { name: 'Lunch', data: selectedDay.lunch, icon: 'partly-sunny-outline' },
      { name: 'Dinner', data: selectedDay.dinner, icon: 'moon-outline' },
    ];

    return (
      <View style={styles.mealDetails}>
        <Text style={styles.sectionTitle}>
          Day {selectedDay.day} Meals ({selectedDay.dailyCalories} calories)
        </Text>
        {meals.map((meal, index) => (
          <View key={index} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <View style={styles.mealTitleContainer}>
                <Ionicons name={meal.icon as any} size={20} color="#8B4A6B" />
                <Text style={styles.mealType}>{meal.name}</Text>
              </View>
              <Text style={styles.mealCalories}>{meal.data.calories} cal</Text>
            </View>
            <Text style={styles.mealName}>{meal.data.name}</Text>

            <View style={styles.mealSection}>
              <Text style={styles.mealSectionTitle}>Ingredients:</Text>
              {meal.data.ingredients.map((ingredient, idx) => (
                <Text key={idx} style={styles.mealItem}>
                  • {ingredient}
                </Text>
              ))}
            </View>

            <View style={styles.mealSection}>
              <Text style={styles.mealSectionTitle}>Recipe:</Text>
              {meal.data.recipes.map((recipe, idx) => (
                <Text key={idx} style={styles.mealItem}>
                  {idx + 1}. {recipe}
                </Text>
              ))}
            </View>

            {/* Meal Status Badge */}
            <View style={styles.mealStatusContainer}>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: meal.data.isDone ? '#10B981' : '#F59E0B',
                  },
                ]}>
                <Text style={styles.statusText}>{meal.data.isDone ? 'Completed' : 'Pending'}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4A6B" />
          <Text style={styles.loadingText}>Loading meal plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meal Plans</Text>
        <TouchableOpacity onPress={() => onNavigate('Add')} style={styles.addButton}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderTabSelector()}
        {renderPlanSelector()}
        {renderDaySelector()}
        {renderMealDetails()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FBF6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B4A6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#8B4A6B',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  planSelector: {
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  selectedPlanCard: {
    borderColor: '#8B4A6B',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  planDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  planDays: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  alternateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#8B4A6B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  alternateButtonText: {
    color: '#8B4A6B',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#8B4A6B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  daySelector: {
    marginBottom: 20,
  },
  dayScroll: {
    marginTop: 8,
  },
  dayCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedDayCard: {
    borderColor: '#8B4A6B',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  dayDate: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  dayCalories: {
    fontSize: 10,
    color: '#8B4A6B',
    fontWeight: '600',
    marginTop: 2,
  },
  mealDetails: {
    marginBottom: 20,
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4A6B',
    marginLeft: 8,
  },
  mealCalories: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  mealSection: {
    marginBottom: 12,
  },
  mealSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  mealItem: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
    lineHeight: 20,
  },
  mealStatusContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
});
