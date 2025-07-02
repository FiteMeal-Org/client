import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SecureStore from 'expo-secure-store';
import {
  validateProfileForPlanCreation,
  showProfileIncompleteAlert,
  showProfileErrorAlert,
} from '../services/profileValidationService';

export default function AddScreen({ navigation }: { navigation: any }) {
  // Form state - hanya yang diperlukan
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [preferences, setPreferences] = useState('');
  const [duration, setDuration] = useState('');
  const [goals, setGoals] = useState('');

  // Loading state
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserProfile = async () => {
    try {
      setProfileLoading(true);
      const token = await SecureStore.getItemAsync('access_token');
      const userId = await SecureStore.getItemAsync('user_id');

      console.log('🔍 Checking auth data...');
      console.log('Token exists:', !!token);
      console.log('User ID:', userId);

      if (!token || !userId) {
        Alert.alert('Authentication Required', 'Please login to create meal plans.', [
          {
            text: 'Login',
            onPress: () => navigation.navigate('Login'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]);
        return;
      }

      console.log('🔍 Fetching profile for user:', userId);

      // Debug URL
      const profileUrl = `https://api-fitemeal.vercel.app/api/profiles/${userId}`;
      console.log('🌐 Profile URL:', profileUrl);

      const response = await fetch(profileUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📡 Profile response status:', response.status);
      console.log('📡 Profile response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Profile error response:', errorText);

        if (response.status === 401) {
          Alert.alert('Session Expired', 'Please login again.', [
            {
              text: 'Login',
              onPress: () => navigation.navigate('Login'),
            },
          ]);
          return;
        }

        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Profile response:', result);

      // PERBAIKAN: Check structure response yang benar
      // Response langsung berisi data profile, bukan nested dalam .data
      if (!result || !result.id) {
        console.log('❌ No profile data in response');
        Alert.alert(
          'Profile Not Found',
          'Your profile data is missing. Please complete your profile first.',
          [
            {
              text: 'Create Profile',
              onPress: () => navigation.navigate('ProfileForm'),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
        return;
      }

      // PERBAIKAN: Map response field names yang benar
      const mappedProfile = {
        id: result.id,
        username: result.username,
        email: result.email,
        age: result.age,
        height: result.height,
        weight: result.weight,
        goals: result.goals, // Jika ada
        activity_level: result.activityLevel, // Map dari activityLevel ke activity_level
        gender: result.gender,
      };

      console.log('✅ Profile mapped successfully:', mappedProfile);

      // Set default plan name berdasarkan username
      if (result.username) {
        setName(`${result.username}'s Meal Plan`);
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      }

      Alert.alert(
        'Profile Error',
        'Cannot load your profile. Please check your connection and try again.',
        [
          {
            text: 'Retry',
            onPress: () => loadUserProfile(),
          },
          {
            text: 'Go to Profile',
            onPress: () => navigation.navigate('ProfileForm'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    console.log('🚀 Starting meal plan creation...');

    // Validasi form
    if (!name.trim()) {
      Alert.alert('Error', 'Plan name is required');
      return;
    }

    if (!preferences.trim()) {
      Alert.alert('Error', 'Dietary preferences are required');
      return;
    }

    if (!duration) {
      Alert.alert('Error', 'Please select duration');
      return;
    }

    if (!goals) {
      Alert.alert('Error', 'Please select goals');
      return;
    }

    // Validasi profil menggunakan service
    try {
      console.log('🔍 AddPlanScreen: Validating profile...');
      const validation = await validateProfileForPlanCreation();

      if (!validation.isValid) {
        console.log('❌ AddPlanScreen: Profile incomplete:', validation.missingFields);
        if (validation.missingFields.includes('profile_error')) {
          showProfileErrorAlert(navigation);
        } else {
          showProfileIncompleteAlert(validation.missingFields, navigation);
        }
        return;
      }

      console.log('✅ AddPlanScreen: Profile is valid, proceeding with plan creation');
      // Continue with plan creation using validation.profile
      const userProfile = validation.profile;

      if (!userProfile) {
        throw new Error('Profile data is missing');
      }

      setLoading(true);

      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please login first.');
        return;
      }

      // Prepare request body menggunakan data dari profile
      const requestBody = {
        name: name.trim(),
        startDate: startDate.toISOString().split('T')[0],
        age: (userProfile.age || 0).toString(),
        weight: userProfile.weight,
        height: userProfile.height,
        gender: userProfile.gender,
        activity_level: userProfile.activityLevel,
        goals: goals || 'General health', // Default jika tidak ada goals
        preferences: preferences.trim(),
        duration: parseInt(duration),
      };

      console.log('🚀 Creating meal plan with body:', requestBody);

      // PERBAIKAN: URL endpoint yang benar
      const prepMealUrl = 'https://api-fitemeal.vercel.app/api/add-prepmeal';
      console.log('🌐 Prep meal URL:', prepMealUrl);

      const response = await fetch(prepMealUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        let errorMessage = `Server error (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.log('❌ Error response:', errorData);
        } catch {
          const errorText = await response.text();
          console.log('❌ Error text:', errorText);
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Meal plan created successfully:', result);

      Alert.alert('Success!', 'Your meal plan has been created successfully!', [
        {
          text: 'View Plans',
          onPress: () => {
            // Clear form
            setName(`${userProfile.username}'s Meal Plan`);
            setPreferences('');
            setDuration('');
            setStartDate(new Date());

            // Navigate to plans
            navigation.navigate('PlansScreen');
          },
        },
      ]);
    } catch (error) {
      console.error('❌ Error creating meal plan:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create meal plan. Please try again.';
      Alert.alert('Error', errorMessage, [
        {
          text: 'Retry',
          onPress: () => handleCreatePlan(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]);
    } finally {
      setLoading(false);
    }
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

  // Render loading state
  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header dengan tombol back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#8B0000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Meal Plan</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.title}>Plan Your Perfect Meals</Text>
          <Text style={styles.subtitle}>
            Using your profile data to create personalized nutrition
          </Text>
        </View>

        {/* Form Content */}
        <View style={styles.form}>
          {/* Plan Name */}
          <Text style={styles.inputLabel}>Plan Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., My Summer Transformation"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />

          {/* Start Date */}
          <Text style={styles.inputLabel}>Start Date</Text>
          <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
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

          {/* Preferences */}
          <Text style={styles.inputLabel}>Dietary Preferences</Text>
          <TextInput
            style={styles.textArea}
            placeholder="e.g., vegetarian, no dairy, gluten-free, no rice, allergies..."
            placeholderTextColor="#999"
            value={preferences}
            onChangeText={setPreferences}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Goals */}
          <Text style={styles.inputLabel}>Goals</Text>
          <View style={styles.goalsContainer}>
            {['Bulking', 'Maintenance', 'Cutting'].map((goal) => (
              <TouchableOpacity
                key={goal}
                style={[styles.goalOption, goals === goal && styles.goalOptionSelected]}
                onPress={() => setGoals(goal)}>
                <Text
                  style={[styles.goalOptionText, goals === goal && styles.goalOptionTextSelected]}>
                  {goal}
                </Text>
                <Text style={[styles.goalSubtext, goals === goal && styles.goalSubtextSelected]}>
                  {goal === 'Bulking'
                    ? 'Build muscle mass'
                    : goal === 'Maintenance'
                      ? 'Maintain current weight'
                      : 'Lose body fat'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Duration */}
          <Text style={styles.inputLabel}>Plan Duration</Text>
          <View style={styles.durationContainer}>
            {['3', '7'].map((days) => (
              <TouchableOpacity
                key={days}
                style={[styles.durationOption, duration === days && styles.durationOptionSelected]}
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
                  {days === '3' ? 'Quick Start' : 'Complete Plan'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Create Button */}
          <TouchableOpacity onPress={handleCreatePlan} activeOpacity={0.8} disabled={loading}>
            <LinearGradient
              colors={loading ? ['#9CA3AF', '#9CA3AF'] : ['#8B0000', '#DC143C', '#FF6B6B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.createButton, loading && styles.createButtonDisabled]}>
              {loading ? (
                <View style={styles.loadingButtonContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.createButtonText}>Creating Plan...</Text>
                </View>
              ) : (
                <Text style={styles.createButtonText}>Create My Meal Plan</Text>
              )}
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
    backgroundColor: '#F8F9FA',
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
  headerRight: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  heroSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 32,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 16,
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
  headerActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
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
  goalsContainer: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 24,
  },
  goalOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  goalOptionSelected: {
    backgroundColor: '#8B0000',
    borderColor: '#8B0000',
  },
  goalOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  goalOptionTextSelected: {
    color: '#FFFFFF',
  },
  goalSubtext: {
    fontSize: 12,
    color: '#6C757D',
  },
  goalSubtextSelected: {
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
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  addExerciseLink: {
    color: '#8B0000',
    fontWeight: '600',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  completePlanLink: {
    color: '#8B0000',
    fontWeight: '600',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
