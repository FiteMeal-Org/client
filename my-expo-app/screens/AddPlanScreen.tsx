import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  age?: number;
  height?: number;
  weight?: number;
  goals?: string;
  activity_level?: string;
  gender?: string;
}

export default function AddScreen({ navigation }: { navigation: any }) {
  // Form state - hanya yang diperlukan
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [preferences, setPreferences] = useState('');
  const [duration, setDuration] = useState('');

  // Loading dan profile state
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadUserProfile();
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
      const profileUrl = `https://fh8mlxkf-3000.asse.devtunnels.ms/api/profiles/${userId}`;
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
              onPress: () => navigation.navigate('ProfilePage'),
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

      setUserProfile(mappedProfile);
      console.log('✅ Profile set successfully:', mappedProfile);

      // Set default plan name berdasarkan username
      if (result.username) {
        setName(`${result.username}'s Meal Plan`);
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);

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
            onPress: () => navigation.navigate('ProfilePage'),
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
    console.log('📊 Current userProfile:', userProfile);

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

    // Validasi data profile dengan logging detail
    if (!userProfile) {
      console.log('❌ User profile is null/undefined');
      Alert.alert('Profile Error', 'User profile not loaded. Please try reloading your profile.', [
        {
          text: 'Reload Profile',
          onPress: () => loadUserProfile(),
        },
        {
          text: 'Go to Profile',
          onPress: () => navigation.navigate('ProfilePage'),
        },
      ]);
      return;
    }

    console.log('🔍 Checking profile completeness...');
    console.log('Age:', userProfile.age);
    console.log('Height:', userProfile.height);
    console.log('Weight:', userProfile.weight);
    console.log('Goals:', userProfile.goals);
    console.log('Activity Level:', userProfile.activity_level);
    console.log('Gender:', userProfile.gender);

    const missingFields = [];
    if (!userProfile.age) missingFields.push('age');
    if (!userProfile.height) missingFields.push('height');
    if (!userProfile.weight) missingFields.push('weight');
    // Goals opsional, karena tidak ada di response
    if (!userProfile.activity_level) missingFields.push('activity level');
    if (!userProfile.gender) missingFields.push('gender');

    if (missingFields.length > 0) {
      console.log('❌ Missing profile fields:', missingFields);
      Alert.alert(
        'Incomplete Profile',
        `Please complete your profile. Missing fields: ${missingFields.join(', ')}`,
        [
          {
            text: 'Complete Profile',
            onPress: () => navigation.navigate('ProfilePage'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    try {
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
        age: userProfile.age.toString(),
        weight: userProfile.weight,
        height: userProfile.height,
        gender: userProfile.gender,
        activity_level: userProfile.activity_level,
        goals: userProfile.goals || 'General health', // Default jika tidak ada goals
        preferences: preferences.trim(),
        duration: parseInt(duration),
      };

      console.log('🚀 Creating meal plan with body:', requestBody);

      // PERBAIKAN: URL endpoint yang benar
      const prepMealUrl = 'https://fh8mlxkf-3000.asse.devtunnels.ms/api/add-prepmeal';
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
        } catch (e) {
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
            navigation.navigate('Plans');
          },
        },
      ]);
    } catch (error) {
      console.error('❌ Error creating meal plan:', error);
      Alert.alert('Error', error.message || 'Failed to create meal plan. Please try again.', [
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
      <View style={{ flex: 1 }}>
        {/* Hero Image dengan Header */}
        <View style={styles.imageHeaderContainer}>
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&h=600&fit=crop',
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
              <Text style={styles.headerTitle}>Create Meal Plan</Text>
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
                  onPress={() => navigation.navigate('PlansScreen')}
                  style={styles.profileButton}>
                  <Ionicons name="person-circle-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Hero Content */}
            <View style={styles.headerContent}>
              <Text style={styles.title}>Plan Your Perfect Meals</Text>
              <Text style={styles.subtitle}>
                Using your profile data to create personalized nutrition
              </Text>
            </View>
          </ImageBackground>
        </View>

        {/* Form Section */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            {/* Profile Info Display */}
            {userProfile && (
              <View style={styles.profileInfoContainer}>
                <Text style={styles.profileInfoTitle}>Your Profile Data</Text>
                <View style={styles.profileInfoGrid}>
                  <View style={styles.profileInfoItem}>
                    <Text style={styles.profileInfoLabel}>Age</Text>
                    <Text style={styles.profileInfoValue}>{userProfile.age || 'Not set'}</Text>
                  </View>
                  <View style={styles.profileInfoItem}>
                    <Text style={styles.profileInfoLabel}>Weight</Text>
                    <Text style={styles.profileInfoValue}>
                      {userProfile.weight || 'Not set'} kg
                    </Text>
                  </View>
                  <View style={styles.profileInfoItem}>
                    <Text style={styles.profileInfoLabel}>Height</Text>
                    <Text style={styles.profileInfoValue}>
                      {userProfile.height || 'Not set'} cm
                    </Text>
                  </View>
                  <View style={styles.profileInfoItem}>
                    <Text style={styles.profileInfoLabel}>Gender</Text>
                    <Text style={styles.profileInfoValue}>{userProfile.gender || 'Not set'}</Text>
                  </View>
                </View>
                <View style={styles.profileInfoRow}>
                  <Text style={styles.profileInfoLabel}>Goals: </Text>
                  <Text style={styles.profileInfoValue}>
                    {userProfile.goals || 'General health'}
                  </Text>
                </View>
                <View style={styles.profileInfoRow}>
                  <Text style={styles.profileInfoLabel}>Activity: </Text>
                  <Text style={styles.profileInfoValue}>
                    {userProfile.activity_level || 'Not set'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.editProfileButton}
                  onPress={() => navigation.navigate('ProfilePage')}>
                  <Ionicons name="create-outline" size={16} color="#8B0000" />
                  <Text style={styles.editProfileText}>Update Profile</Text>
                </TouchableOpacity>
              </View>
            )}

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

            {/* Duration */}
            <Text style={styles.inputLabel}>Plan Duration</Text>
            <View style={styles.durationContainer}>
              {['3', '7'].map((days) => (
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

            {/* Bottom Navigation - tetap sama */}
            <View style={styles.bottomRegisterContainer}>
              <Text style={styles.bottomRegisterText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.bottomRegisterLink}>Login</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bottomRegisterContainer}>
              <Text style={styles.bottomRegisterText}>Need to create an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.bottomRegisterLink}>Register</Text>
              </TouchableOpacity>
            </View>

            {/* Add Exercise Link */}
            <View style={styles.bottomRegisterContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('AddExerciseScreen')}>
                <Text style={styles.addExerciseLink}>Add Exercise</Text>
              </TouchableOpacity>
            </View>

            {/* Complete Plan Link */}
            <View style={styles.bottomRegisterContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('AddCompletePlan')}>
                <Text style={styles.completePlanLink}>Meal Plan & Exercise Plan</Text>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
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

  // Profile Info Styles - NEW
  profileInfoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 16,
    textAlign: 'center',
  },
  profileInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  profileInfoItem: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  profileInfoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  profileInfoValue: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  editProfileText: {
    color: '#8B0000',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
