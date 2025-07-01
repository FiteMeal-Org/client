import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as SecureStore from 'expo-secure-store';
import { getUserProfile, UserProfile } from '../services/profileService';
import { API_CONFIG } from '../config/api';

export default function AddMealExercisePlanScreen() {
  const navigation = useNavigation();

  // Form states
  const [name, setName] = useState('');
  const [goals, setGoals] = useState<'cutting' | 'maintenance' | 'bulking'>('maintenance');
  const [preferences, setPreferences] = useState('');
  const [equipment, setEquipment] = useState('');
  const [duration, setDuration] = useState<3 | 5 | 7>(7);
  const [startDate, setStartDate] = useState('');

  // Profile data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load profile data on component mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userProfile = await getUserProfile();
      setProfile(userProfile);
      console.log('📋 Profile loaded:', userProfile);
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data. Please ensure your profile is complete.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a plan name');
      return false;
    }
    if (!startDate.trim()) {
      Alert.alert('Validation Error', 'Please enter a start date');
      return false;
    }
    if (
      !profile?.age ||
      !profile?.weight ||
      !profile?.height ||
      !profile?.gender ||
      !profile?.activityLevel
    ) {
      Alert.alert(
        'Incomplete Profile',
        'Please complete your profile first (age, weight, height, gender, activity level)'
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        Alert.alert('Error', 'No access token found. Please login again.');
        return;
      }

      // Convert start date to ISO format
      const isoStartDate = new Date(startDate).toISOString();

      const requestBody = {
        name: name.trim(),
        age: profile!.age,
        weight: profile!.weight,
        height: profile!.height,
        gender: profile!.gender,
        activity_level: profile!.activityLevel,
        goals,
        preferences: preferences.trim(),
        equipment: equipment.trim(),
        duration,
        startDate: isoStartDate,
      };

      console.log('📡 Sending request to create meal & exercise plan:', requestBody);

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/add-meal-exercise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Meal & Exercise Plan created successfully:', result);

      Alert.alert('Success!', 'Your meal & exercise plan has been created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Plans' as never),
        },
      ]);
    } catch (error) {
      console.error('❌ Error creating meal & exercise plan:', error);
      Alert.alert('Error', 'Failed to create meal & exercise plan. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
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
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Meal & Exercise Plan</Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Plan Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Plan Name *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your plan name (e.g., 'Summer Body Goal')"
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
        </View>

        {/* Profile Info Display */}
        <View style={styles.profileInfoContainer}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <View style={styles.profileInfoGrid}>
            <View style={styles.profileInfoItem}>
              <Text style={styles.profileInfoLabel}>Age</Text>
              <Text style={styles.profileInfoValue}>{profile?.age || 'N/A'}</Text>
            </View>
            <View style={styles.profileInfoItem}>
              <Text style={styles.profileInfoLabel}>Weight</Text>
              <Text style={styles.profileInfoValue}>{profile?.weight || 'N/A'} kg</Text>
            </View>
            <View style={styles.profileInfoItem}>
              <Text style={styles.profileInfoLabel}>Height</Text>
              <Text style={styles.profileInfoValue}>{profile?.height || 'N/A'} cm</Text>
            </View>
            <View style={styles.profileInfoItem}>
              <Text style={styles.profileInfoLabel}>Gender</Text>
              <Text style={styles.profileInfoValue}>{profile?.gender || 'N/A'}</Text>
            </View>
            <View style={styles.profileInfoItem}>
              <Text style={styles.profileInfoLabel}>Activity Level</Text>
              <Text style={styles.profileInfoValue}>{profile?.activityLevel || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Goals */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Goals *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={goals}
              onValueChange={(itemValue) => setGoals(itemValue)}
              style={styles.picker}>
              <Picker.Item label="Cutting (Weight Loss)" value="cutting" />
              <Picker.Item label="Maintenance" value="maintenance" />
              <Picker.Item label="Bulking (Weight Gain)" value="bulking" />
            </Picker>
          </View>
        </View>

        {/* Duration */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Duration *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={duration}
              onValueChange={(itemValue) => setDuration(itemValue)}
              style={styles.picker}>
              <Picker.Item label="3 Days" value={3} />
              <Picker.Item label="5 Days" value={5} />
              <Picker.Item label="7 Days" value={7} />
            </Picker>
          </View>
        </View>

        {/* Start Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Start Date *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="YYYY-MM-DD (e.g., 2024-12-25)"
            value={startDate}
            onChangeText={setStartDate}
            maxLength={10}
          />
          <Text style={styles.helpText}>Format: YYYY-MM-DD</Text>
        </View>

        {/* Preferences */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Food Preferences</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Enter any food preferences, allergies, or dietary restrictions..."
            value={preferences}
            onChangeText={setPreferences}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Equipment */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Available Equipment</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Enter available gym equipment (e.g., dumbbells, treadmill, yoga mat)..."
            value={equipment}
            onChangeText={setEquipment}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}>
          {submitting ? (
            <View style={styles.submittingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Creating Plan...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Create Meal & Exercise Plan</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 16,
    fontSize: 16,
    color: '#333333',
  },
  textArea: {
    minHeight: 80,
  },
  helpText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  profileInfoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  profileInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  profileInfoItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  profileInfoLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 4,
  },
  profileInfoValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submittingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
