import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

export default function ProfileFormScreen({
  navigation,
  route,
}: {
  navigation: StackNavigationProp<any>;
  route?: any;
}) {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Check if this is edit mode
  const isEditMode = route?.params?.editMode || false;

  // Profile form data
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('');

  useEffect(() => {
    checkUserProfile();
  }, []);

  const checkUserProfile = async () => {
    try {
      setInitialLoading(true);

      // Gunakan SecureStore untuk konsistensi
      const storedUserId = await SecureStore.getItemAsync('user_id');
      const token = await SecureStore.getItemAsync('access_token'); // Ubah ke access_token

      console.log('🔍 Stored User ID:', storedUserId);
      console.log('🔍 Token exists:', token ? 'Yes' : 'No');

      if (!storedUserId || !token) {
        Alert.alert('Error', 'Session expired. Please login again.');
        navigation.navigate('Login');
        return;
      }

      setUserId(storedUserId);

      // Get user profile from backend
      console.log('📡 Fetching profile for user:', storedUserId);
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/profiles/${storedUserId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📄 Profile response:', response.data);
      const profile = response.data.data || response.data;

      // Pre-fill form with existing data (removed completeness check)
      if (profile.height) setHeight(profile.height.toString());
      if (profile.weight) setWeight(profile.weight.toString());
      if (profile.activityLevel) setActivityLevel(profile.activityLevel);
    } catch (error: any) {
      console.log('❌ Profile check error:', error.response?.data || error.message);
    } finally {
      setInitialLoading(false);
    }
  };

  // Update header title based on mode
  const getHeaderTitle = () => {
    return isEditMode ? 'Edit Profil' : 'Lengkapi Profil Anda';
  };

  const getHeaderSubtitle = () => {
    return isEditMode
      ? 'Update informasi profil Anda'
      : 'Kami perlu informasi tambahan untuk memberikan rekomendasi meal plan yang tepat';
  };

  const getButtonText = () => {
    return isEditMode
      ? loading
        ? 'Mengupdate...'
        : 'Update Profil'
      : loading
        ? 'Menyimpan...'
        : 'Simpan Profil';
  };

  const handleSaveProfile = async () => {
    setError('');
    setLoading(true);

    // Validasi input
    if (!height.trim()) {
      setError('Tinggi badan harus diisi');
      setLoading(false);
      return;
    }

    if (!weight.trim()) {
      setError('Berat badan harus diisi');
      setLoading(false);
      return;
    }

    if (!activityLevel) {
      setError('Tingkat aktivitas harus dipilih');
      setLoading(false);
      return;
    }

    // Validasi range nilai
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (heightNum < 100 || heightNum > 250) {
      setError('Tinggi badan harus antara 100-250 cm');
      setLoading(false);
      return;
    }

    if (weightNum < 30 || weightNum > 200) {
      setError('Berat badan harus antara 30-200 kg');
      setLoading(false);
      return;
    }

    try {
      const token = await SecureStore.getItemAsync('access_token'); // Ubah ke access_token

      if (!userId || !token) {
        Alert.alert('Error', 'Session expired. Please login again.');
        navigation.navigate('Login');
        return;
      }

      console.log('💾 Saving profile for user:', userId);
      console.log('📊 Profile data:', {
        height: heightNum,
        weight: weightNum,
        activityLevel,
      });

      const response = await axios.patch(
        `${API_CONFIG.BASE_URL}/api/profiles/${userId}`,
        {
          height: heightNum,
          weight: weightNum,
          activityLevel,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Profile saved successfully:', response.data);

      Alert.alert(
        'Profil Berhasil Dilengkapi!',
        'Sekarang Anda dapat menggunakan semua fitur aplikasi.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.log('❌ Profile Error:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Gagal menyimpan profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <SafeAreaView style={styles.container}>
        {initialLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>
              {isEditMode ? 'Memuat profil Anda...' : 'Memeriksa profil Anda...'}
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {/* Header with back button for edit mode */}
            {isEditMode && (
              <View style={styles.editHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="#6366F1" />
                </TouchableOpacity>
                <Text style={styles.editHeaderTitle}>Edit Profile</Text>
                <View style={styles.backButton} />
              </View>
            )}

            {/* Header */}
            <LinearGradient
              colors={['#F8FAFC', '#E2E8F0', '#CBD5E1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}>
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <View style={styles.logo}>
                    <Ionicons
                      name={isEditMode ? 'create' : 'person-add'}
                      size={32}
                      color="#6366F1"
                    />
                  </View>
                </View>
                <Text style={styles.title}>{getHeaderTitle()}</Text>
                <Text style={styles.subtitle}>{getHeaderSubtitle()}</Text>
              </View>
            </LinearGradient>

            {/* Form */}
            <View style={styles.form}>
              {/* Height */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Tinggi Badan (cm)</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="resize-outline"
                    size={20}
                    color="#6366F1"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: 170"
                    placeholderTextColor="#999"
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                  />
                  <Text style={styles.unitText}>cm</Text>
                </View>
              </View>

              {/* Weight */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Berat Badan (kg)</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="fitness-outline"
                    size={20}
                    color="#6366F1"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: 65"
                    placeholderTextColor="#999"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                  />
                  <Text style={styles.unitText}>kg</Text>
                </View>
              </View>

              {/* Activity Level */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Tingkat Aktivitas</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="walk-outline"
                    size={20}
                    color="#6366F1"
                    style={styles.inputIcon}
                  />
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={activityLevel}
                      style={styles.picker}
                      onValueChange={(itemValue) => setActivityLevel(itemValue)}
                      dropdownIconColor="#84CC16">
                      <Picker.Item label="Pilih tingkat aktivitas" value="" />
                      <Picker.Item label="Inactive (Tidak Aktif)" value="inactive" />
                      <Picker.Item label="Somewhat Active (Agak Aktif)" value="somewhat active" />
                      <Picker.Item label="Active (Aktif)" value="active" />
                      <Picker.Item label="Very Active (Sangat Aktif)" value="very active" />
                    </Picker>
                  </View>
                </View>
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#FF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Save Button with dynamic text */}
              <TouchableOpacity
                onPress={handleSaveProfile}
                activeOpacity={0.8}
                style={styles.saveButtonContainer}
                disabled={loading}>
                <LinearGradient
                  colors={['#6366F1', '#4F46E5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButton}>
                  <Text style={styles.saveButtonText}>{getButtonText()}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
}

// Add styles for edit header
const additionalStyles = StyleSheet.create({
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  editHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Merge with existing styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingBottom: 40,
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#84CC16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  form: {
    paddingHorizontal: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    paddingHorizontal: 16,
    shadowColor: '#84CC16',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2D3748',
  },
  unitText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
    marginLeft: 8,
  },
  pickerWrapper: {
    flex: 1,
    marginLeft: -8,
  },
  picker: {
    flex: 1,
    color: '#2D3748',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  saveButtonContainer: {
    marginBottom: 40,
  },
  saveButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#84CC16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  ...additionalStyles,
});
