import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';

type PlansScreenProps = {
  onNavigate: (screen: string) => void;
};

interface PrepMealData {
  _id: string;
  name: string;
  userId: string;
  startDate: string;
  todoList: Array<{
    day: number;
    date: string;
    dailyCalories: number;
    breakfast: MealDetail;
    lunch: MealDetail;
    dinner: MealDetail;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface MealDetail {
  name: string;
  imageUrl: string;
  calories: number;
  ingredients: string[];
  recipes: string[];
  isDone: boolean;
  notes: string;
}

export default function PlansScreen({ onNavigate }: PlansScreenProps) {
  type MealType = 'breakfast' | 'lunch' | 'dinner';

  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  const [userNotes, setUserNotes] = useState('');
  const [selectedDay, setSelectedDay] = useState(0); // Index of selected day
  const [prepMealData, setPrepMealData] = useState<PrepMealData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrepMeal, setSelectedPrepMeal] = useState<PrepMealData | null>(null);

  const mealTypes: { key: MealType; label: string }[] = [
    { key: 'breakfast', label: 'Breakfast' },
    { key: 'lunch', label: 'Lunch' },
    { key: 'dinner', label: 'Dinner' },
  ];

  useEffect(() => {
    loadPrepMeals();
  }, []);

  const loadPrepMeals = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('access_token');

      if (!token) {
        Alert.alert('Error', 'No authentication token found. Please login again.');
        onNavigate('Login');
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PREP_MEAL}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert('Error', 'Session expired. Please login again.');
          await SecureStore.deleteItemAsync('access_token');
          onNavigate('Login');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setPrepMealData(result.data);
      if (result.data.length > 0) {
        setSelectedPrepMeal(result.data[0]);
      } else {
        // Jika tidak ada meal plan, redirect ke form
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
              onPress: () => onNavigate('Add'), // Ganti dengan nama screen form Anda
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load meal plans');
      console.error('Error loading prep meals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get current meal data
  const getCurrentMeal = (): MealDetail | null => {
    if (!selectedPrepMeal || !selectedPrepMeal.todoList[selectedDay]) {
      return null;
    }
    return selectedPrepMeal.todoList[selectedDay][selectedMealType];
  };

  // Get current day's calories
  const getCurrentDayCalories = (): number => {
    if (!selectedPrepMeal || !selectedPrepMeal.todoList[selectedDay]) {
      return 0;
    }
    return selectedPrepMeal.todoList[selectedDay].dailyCalories;
  };

  // Get weekday name from date
  const getWeekdayName = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Get month and year from start date
  const getMonthYear = (): string => {
    if (!selectedPrepMeal) return 'Loading...';
    const date = new Date(selectedPrepMeal.startDate);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const currentMeal = getCurrentMeal();

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading meal plans...</Text>
      </View>
    );
  }

  if (!selectedPrepMeal || !currentMeal) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.noDataText}>No meal plans available</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadPrepMeals}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{selectedPrepMeal.name}</Text>
          <TouchableOpacity style={styles.addButton} onPress={loadPrepMeals}>
            <Text style={styles.addButtonText}>↻</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Section */}
        <View style={styles.calendarSection}>
          <View style={styles.monthHeader}>
            <Text style={styles.monthText}>{getMonthYear()}</Text>
            <TouchableOpacity style={styles.calendarIcon}>
              <Text style={styles.calendarIconText}>📅</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekContainer}>
            {selectedPrepMeal.todoList.map((dayData, index) => {
              const weekdayName = getWeekdayName(dayData.date);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayContainer,
                    selectedDay === index && styles.selectedDayContainer,
                  ]}
                  onPress={() => setSelectedDay(index)}>
                  <Text style={[styles.dayText, selectedDay === index && styles.selectedDayText]}>
                    {weekdayName}
                  </Text>
                  <Text style={[styles.dateText, selectedDay === index && styles.selectedDateText]}>
                    Day {dayData.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Daily Calories Section */}
        <View style={styles.dailyCaloriesSection}>
          <Text style={styles.dailyCaloriesTitle}>Daily Calories</Text>
          <View style={styles.caloriesCard}>
            <Text style={styles.caloriesNumber}>{getCurrentDayCalories().toLocaleString()}</Text>
            <Text style={styles.caloriesLabel}>kcal target</Text>
          </View>
        </View>

        {/* Meal Type Tabs */}
        <View style={styles.mealTypesContainer}>
          {mealTypes.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.mealTypeTab,
                selectedMealType === type.key && styles.selectedMealTypeTab,
              ]}
              onPress={() => setSelectedMealType(type.key)}>
              <Text
                style={[
                  styles.mealTypeText,
                  selectedMealType === type.key && styles.selectedMealTypeText,
                ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recipe Detail Section */}
        <View style={styles.recipeDetailSection}>
          {/* Recipe Name and Calories */}
          <View style={styles.recipeHeader}>
            <Text style={styles.recipeName}>{currentMeal.name}</Text>
            <Text style={styles.recipeCalories}>{currentMeal.calories} kcal</Text>
          </View>

          {/* Ingredients */}
          <View style={styles.ingredientsSection}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientsList}>
              {currentMeal.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Recipes/Instructions */}
          <View style={styles.recipesSection}>
            <Text style={styles.sectionTitle}>Recipes</Text>
            <View style={styles.recipesList}>
              {currentMeal.recipes.map((step, index) => (
                <View key={index} style={styles.recipeStep}>
                  <Text style={styles.stepNumber}>{index + 1}.</Text>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Notes Section */}
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesInputContainer}>
              <Text style={styles.notesPlaceholder}>
                {currentMeal.notes || userNotes || 'Add your personal notes here...'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Home')}>
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>🏠</Text>
          </View>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Search')}>
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>📊</Text>
          </View>
          <Text style={styles.navLabel}>Activity</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addNavButton}>
          <View style={styles.addButtonDots}>
            <View style={styles.dot}></View>
            <View style={styles.dot}></View>
            <View style={styles.dot}></View>
            <View style={styles.dot}></View>
            <View style={styles.dot}></View>
            <View style={styles.dot}></View>
            <View style={styles.dot}></View>
            <View style={styles.dot}></View>
            <View style={styles.dot}></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>🗓️</Text>
          </View>
          <Text style={[styles.navLabel, styles.activeNavLabel]}>Scheduler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Profile')}>
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>👤</Text>
          </View>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0F5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  noDataText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  scrollContent: {
    flex: 1,
    marginBottom: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  calendarSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  monthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  calendarIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E8D5F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarIconText: {
    fontSize: 16,
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dayContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectedDayContainer: {
    backgroundColor: '#8B5CF6',
  },
  dayText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  selectedDayText: {
    color: 'white',
  },
  dateText: {
    fontSize: 11,
    color: '#1F2937',
    fontWeight: '600',
  },
  selectedDateText: {
    color: 'white',
  },
  dailyCaloriesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dailyCaloriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  caloriesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  caloriesNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  caloriesLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  mealTypesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mealTypeTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  selectedMealTypeTab: {
    borderBottomColor: '#1F2937',
  },
  mealTypeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedMealTypeText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  recipeDetailSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recipeHeader: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    alignItems: 'center',
  },
  recipeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  recipeCalories: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  ingredientsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  ingredientsList: {
    // Remove gap property
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8, // Add this instead of gap
  },
  bulletPoint: {
    fontSize: 14,
    color: '#8B5CF6',
    marginRight: 8,
    marginTop: 2,
    fontWeight: 'bold',
  },
  ingredientText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  recipesSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  recipesList: {
    // Remove gap property
  },
  recipeStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12, // Add this instead of gap
  },
  stepNumber: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: 'bold',
    marginRight: 8,
    marginTop: 2,
    minWidth: 20,
  },
  stepText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },

  notesSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  notesInputContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    backgroundColor: '#F9FAFB',
  },
  notesPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingBottom: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  navIconText: {
    fontSize: 16,
  },
  navLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeNavLabel: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  addNavButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  addButtonDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 24,
    height: 24,
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
});
