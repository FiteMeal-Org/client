import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import LoadingOverlay from '../components/LoadingOverlay';

export default function MealPlanAndExerciseScreen({ navigation }: { navigation: any }) {
  // Meal Plan States
  const [mealPlanName, setMealPlanName] = useState('');
  const [mealGoals, setMealGoals] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState('');

  // Exercise Plan States
  const [exercisePlanName, setExercisePlanName] = useState('');
  const [exerciseGoals, setExerciseGoals] = useState('');
  const [exerciseLevel, setExerciseLevel] = useState('');

  // Shared States (untuk kedua plan)
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [duration, setDuration] = useState('');

  const handleCreateCombinedPlan = () => {
    // Validasi Meal Plan
    if (!mealPlanName.trim()) {
      Alert.alert('Error', 'Meal plan name is required');
      return;
    }
    if (!mealGoals) {
      Alert.alert('Error', 'Please select meal plan goal');
      return;
    }

    // Validasi Exercise Plan
    if (!exercisePlanName.trim()) {
      Alert.alert('Error', 'Exercise plan name is required');
      return;
    }
    if (!exerciseGoals) {
      Alert.alert('Error', 'Please select exercise goal');
      return;
    }
    if (!exerciseLevel) {
      Alert.alert('Error', 'Please select exercise level');
      return;
    }

    // Validasi Shared (duration)
    if (!duration) {
      Alert.alert('Error', 'Please select plan duration');
      return;
    }

    // Data gabungan sesuai struktur database
    const combinedPlanData = {
      mealPlan: {
        name: mealPlanName.trim(),
        startDate: startDate.toISOString().split('T')[0], // Menggunakan startDate yang sama
        goals: mealGoals,
        preferences: dietaryPreferences.trim(),
        duration: duration,
        dailyCalories: '2000',
        breakfast: 'High Protein Breakfast',
        lunch: 'Balanced Lunch',
        dinner: 'Light Dinner',
        groceryList: 'Chicken, Rice, Vegetables',
      },
      exercisePlan: {
        name: exercisePlanName.trim(),
        startDate: startDate.toISOString().split('T')[0], // Menggunakan startDate yang sama
        goals: exerciseGoals,
        exerciseLevel: exerciseLevel,
        duration: duration,
        exercises: getExercisesByGoal(exerciseGoals).join(', '),
        repetitions: '3 sets of 10-12 reps',
        sets: '3-4 sets',
        isDone: false,
        youtubeUrl: 'https://youtube.com/watch?v=example',
        notes: 'Follow proper form',
      },
    };

    Alert.alert('Success', 'Complete meal and exercise plan created successfully!');
    console.log('Combined Plan Data:', combinedPlanData);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getExercisesByGoal = (goal: string) => {
    const exercises = {
      bulking: ['Bench Press', 'Deadlift', 'Squats', 'Pull-ups', 'Overhead Press'],
      cutting: ['HIIT Cardio', 'Running', 'Cycling', 'Jump Rope', 'Circuit Training'],
      fat_loss: ['Burpees', 'Mountain Climbers', 'High Knees', 'Plank', 'Jumping Jacks'],
      maintain: ['Push-ups', 'Yoga', 'Walking', 'Swimming', 'Bodyweight Squats'],
      muscle_gain: ['Barbell Rows', 'Dumbbell Press', 'Leg Press', 'Bicep Curls', 'Tricep Dips'],
    };
    return exercises[goal as keyof typeof exercises] || [];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        {/* Hero Image dengan Header */}
        <View style={styles.imageHeaderContainer}>
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
            }}
            style={styles.imageHeader}>
            <LinearGradient
              colors={[
                'rgba(255,255,255,0)',
                'rgba(255,255,255,0)',
                'rgba(255,255,255,0.3)',
                'rgba(255,255,255,0.6)',
                'rgba(255,255,255,0.85)',
                'rgba(248,249,250,1)',
              ]}
              locations={[0, 0.4, 0.6, 0.75, 0.9, 1]}
              style={styles.imageGradient}
            />

            {/* Header Navigation */}
            <View style={styles.headerOverlay}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Complete Wellness Plan</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  style={styles.headerButton}>
                  <Text style={styles.headerButtonText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Register')}
                  style={[styles.headerButton, styles.headerButtonSecondary]}>
                  <Text style={styles.headerButtonTextSecondary}>Register</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ProfilePage')}
                  style={styles.profileButton}>
                  <Ionicons name="person-circle-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Hero Content */}
            <View style={styles.headerContent}>
              <Text style={styles.title}>Complete Wellness Journey</Text>
              <Text style={styles.subtitle}>
                Create both meal and exercise plans in one comprehensive form
              </Text>
            </View>
          </ImageBackground>
        </View>

        {/* Form Section */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            {/* SHARED START DATE SECTION */}
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={24} color="#8B0000" />
              <Text style={styles.sectionTitle}>Plan Start Date</Text>
            </View>

            <Text style={styles.inputLabel}>Start Date for Both Plans</Text>
            <Text style={styles.durationDescription}>
              This date will be used for both your meal plan and exercise plan
            </Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateText}>{formatDate(startDate)}</Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            {/* MEAL PLAN SECTION */}
            <View style={[styles.sectionHeader, { marginTop: 40 }]}>
              <Ionicons name="restaurant-outline" size={24} color="#8B0000" />
              <Text style={styles.sectionTitle}>Meal Plan Details</Text>
            </View>

            {/* Meal Plan Name */}
            <Text style={styles.inputLabel}>Meal Plan Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., My Summer Nutrition Plan"
              placeholderTextColor="#999"
              value={mealPlanName}
              onChangeText={setMealPlanName}
            />

            {/* Meal Goals */}
            <Text style={styles.inputLabel}>Nutrition Goal</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={mealGoals}
                style={styles.picker}
                onValueChange={(itemValue) => setMealGoals(itemValue)}
                dropdownIconColor="#999">
                <Picker.Item label="Select nutrition goal..." value="" />
                <Picker.Item label="Cutting" value="cutting" />
                <Picker.Item label="Maintenance" value="maintenance" />
                <Picker.Item label="Bulking" value="bulking" />
              </Picker>
            </View>

            {/* Dietary Preferences */}
            <Text style={styles.inputLabel}>Dietary Preferences</Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g., vegetarian, no dairy, gluten-free, no rice..."
              placeholderTextColor="#999"
              value={dietaryPreferences}
              onChangeText={setDietaryPreferences}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* EXERCISE PLAN SECTION */}
            <View style={[styles.sectionHeader, { marginTop: 40 }]}>
              <Ionicons name="fitness-outline" size={24} color="#8B0000" />
              <Text style={styles.sectionTitle}>Exercise Plan Details</Text>
            </View>

            {/* Exercise Plan Name */}
            <Text style={styles.inputLabel}>Exercise Plan Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., My Strength Building Program"
              placeholderTextColor="#999"
              value={exercisePlanName}
              onChangeText={setExercisePlanName}
            />

            {/* Exercise Goals */}
            <Text style={styles.inputLabel}>Fitness Goal</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={exerciseGoals}
                style={styles.picker}
                onValueChange={(itemValue) => setExerciseGoals(itemValue)}
                dropdownIconColor="#999">
                <Picker.Item label="Select fitness goal..." value="" />
                <Picker.Item label="Cutting" value="cutting" />
                <Picker.Item label="Maintenance" value="maintenance" />
                <Picker.Item label="Bulking" value="bulking" />
              </Picker>
            </View>

            {/* Exercise Level */}
            <Text style={styles.inputLabel}>Exercise Level</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={exerciseLevel}
                style={styles.picker}
                onValueChange={(itemValue) => setExerciseLevel(itemValue)}
                dropdownIconColor="#999">
                <Picker.Item label="Select your level..." value="" />
                <Picker.Item label="Beginner" value="beginner" />
                <Picker.Item label="Intermediate" value="intermediate" />
                <Picker.Item label="Advanced" value="advanced" />
                <Picker.Item label="Expert" value="expert" />
              </Picker>
            </View>

            {/* Recommended Exercises Preview */}
            {exerciseGoals && (
              <View style={styles.recommendedSection}>
                <Text style={styles.inputLabel}>Recommended Exercises</Text>
                <View style={styles.exercisesList}>
                  {getExercisesByGoal(exerciseGoals).map((exercise, index) => (
                    <View key={index} style={styles.exerciseItem}>
                      <Ionicons name="fitness-outline" size={16} color="#8B0000" />
                      <Text style={styles.exerciseText}>{exercise}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* SHARED DURATION SECTION */}
            <View style={[styles.sectionHeader, { marginTop: 40 }]}>
              <Ionicons name="time-outline" size={24} color="#8B0000" />
              <Text style={styles.sectionTitle}>Plan Duration</Text>
            </View>

            <Text style={styles.inputLabel}>Complete Plan Duration</Text>
            <Text style={styles.durationDescription}>
              This duration will apply to both your meal plan and exercise plan
            </Text>
            <View style={styles.durationContainer}>
              {['3', '5', '7'].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.durationOption,
                    duration === days && styles.durationOptionSelected,
                  ]}
                  onPress={() => setDuration(days)}>
                  <Text
                    style={[
                      styles.durationOptionText,
                      duration === days && styles.durationOptionTextSelected,
                    ]}>
                    {days} Days
                  </Text>
                  <Text
                    style={[
                      styles.durationSubtext,
                      duration === days && styles.durationSubtextSelected,
                    ]}>
                    {days === '3' ? 'Quick Start' : days === '5' ? 'Balanced' : 'Complete'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Create Button */}
            <TouchableOpacity onPress={handleCreateCombinedPlan} activeOpacity={0.8}>
              <LinearGradient
                colors={['#8B0000', '#DC143C', '#FF6B6B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.createButton}>
                <Text style={styles.createButtonText}>Create Complete Wellness Plan</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Bottom Navigation */}
            <View style={styles.bottomRegisterContainer}>
              <Text style={styles.bottomRegisterText}>Just need meal plan? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('AddScreen')}>
                <Text style={styles.bottomRegisterLink}>Meal Plan Only</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bottomRegisterContainer}>
              <Text style={styles.bottomRegisterText}>Just need exercise plan? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('AddExercise')}>
                <Text style={styles.bottomRegisterLink}>Exercise Plan Only</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  imageHeaderContainer: {
    height: 300,
    width: '100%',
    overflow: 'hidden',
  },
  imageHeader: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    width: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 60,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerButtonSecondary: {
    backgroundColor: '#FFFFFF',
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  headerButtonTextSecondary: {
    color: '#8B0000',
    fontSize: 14,
    fontWeight: '600',
  },
  profileButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginLeft: 6,
  },
  headerContent: {
    position: 'absolute',
    left: 24,
    bottom: 60,
    right: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
    opacity: 0.9,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 40,
    backgroundColor: '#F8F9FA',
    marginTop: -20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B0000',
    marginLeft: 12,
  },
  inputLabel: {
    fontSize: 16,
    color: '#8B0000',
    marginBottom: 12,
    fontWeight: '600',
    marginTop: 24,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2C3E50',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    fontFamily: 'System',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  datePickerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  picker: {
    color: '#2C3E50',
    backgroundColor: 'transparent',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2C3E50',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    fontFamily: 'System',
    minHeight: 100,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recommendedSection: {
    marginBottom: 24,
  },
  exercisesList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  exerciseText: {
    fontSize: 15,
    color: '#2C3E50',
    marginLeft: 12,
    fontWeight: '500',
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 32,
  },
  durationOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  durationOptionSelected: {
    backgroundColor: '#8B0000',
    borderColor: '#8B0000',
  },
  durationOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  durationOptionTextSelected: {
    color: '#FFFFFF',
  },
  durationSubtext: {
    fontSize: 12,
    color: '#6C757D',
  },
  durationSubtextSelected: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  createButton: {
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bottomRegisterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  bottomRegisterText: {
    color: '#6C757D',
    fontSize: 14,
  },
  bottomRegisterLink: {
    color: '#8B0000',
    fontWeight: '600',
    fontSize: 14,
  },
  durationDescription: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 16,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
