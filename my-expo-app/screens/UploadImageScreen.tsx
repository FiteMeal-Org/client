import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import type { StackNavigationProp } from '@react-navigation/stack';

type UploadImageScreenProps = {
  navigation: StackNavigationProp<any>;
  route: {
    params?: {
      plansId?: string;
      planId?: string;
      planName?: string;
    };
  };
};

export default function UploadImageScreen({ navigation, route }: UploadImageScreenProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorUpload, setErrorUpload] = useState('');

  // Get plansId dari navigation params
  const plansId = route.params?.plansId || route.params?.planId;
  const planName = route.params?.planName || 'Meal Plan';

  useEffect(() => {
    console.log('📋 Upload Image Screen loaded with params:', route.params);

    // Check berbagai kemungkinan parameter name
    const possiblePlansId = route.params?.plansId || route.params?.planId;
    const possiblePlanName = route.params?.planName;

    console.log('🆔 Plans ID (plansId):', route.params?.plansId);
    console.log('🆔 Plan ID (planId):', route.params?.planId);
    console.log('🆔 Final Plans ID:', possiblePlansId);
    console.log('📝 Plan Name:', possiblePlanName);

    if (!possiblePlansId) {
      console.log('❌ No Plans ID found in any parameter');
      Alert.alert('Error', 'Plans ID not found. Please go back and try again.', [
        {
          text: 'Go Back',
          onPress: () => navigation.goBack(),
        },
      ]);
    }
  }, [route.params]);

  // Request permission untuk camera dan gallery
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need permission to access your photo gallery!');
      return false;
    }
    return true;
  };

  // Pilih image dari gallery
  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setErrorUpload('');
    }
  };

  // Ambil foto dengan camera
  const takePhotoWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need permission to access your camera!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setErrorUpload('');
    }
  };

  // Show options untuk pilih sumber image
  const showImagePickerOptions = () => {
    Alert.alert('Select Image Source', 'Choose how you want to select your meal photo', [
      { text: 'Camera', onPress: takePhotoWithCamera },
      { text: 'Gallery', onPress: pickImageFromGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Upload image ke server
  const uploadImage = async () => {
    setErrorUpload('');
    setIsUploading(true);

    // Validasi
    if (!selectedImage) {
      setErrorUpload('Please select a photo first');
      setIsUploading(false);
      return;
    }

    // Check plansId dari berbagai sumber - PERBAIKAN
    let finalPlansId = route.params?.plansId || route.params?.planId;

    console.log('🔍 Getting plansId from params:');
    console.log('- route.params?.plansId:', route.params?.plansId);
    console.log('- route.params?.planId:', route.params?.planId);
    console.log('- finalPlansId:', finalPlansId);

    if (!finalPlansId) {
      setErrorUpload('Plans ID is missing. Please go back and try again.');
      setIsUploading(false);
      return;
    }

    try {
      // Get userId from SecureStore
      const userId = await SecureStore.getItemAsync('user_id');
      const token = await SecureStore.getItemAsync('access_token');

      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      console.log('🔍 Preparing upload data...');
      console.log('👤 User ID:', userId);
      console.log('📋 Final Plans ID:', finalPlansId);
      console.log('📸 Image URI:', selectedImage);

      // Buat FormData untuk upload
      const formData = new FormData();

      // Append image file dengan key 'photo'
      formData.append('photo', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'meal-photo.jpg',
      } as any);

      // Append plansId dan userId
      formData.append('plansId', finalPlansId);
      formData.append('userId', userId);

      // Log FormData contents untuk debug
      console.log('📦 FormData contents:');
      console.log('- photo: image file');
      console.log('- plansId:', finalPlansId);
      console.log('- userId:', userId);

      const uploadUrl = 'https://fh8mlxkf-3000.asse.devtunnels.ms/api/upload';
      console.log('🚀 Uploading to:', uploadUrl);

      // Upload using fetch instead of axios
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type for FormData, let the browser set it
        },
        body: formData,
      });

      console.log('📡 Upload response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Upload error response:', errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Upload Success:', result);

      Alert.alert('Success!', 'Your meal photo has been uploaded successfully!', [
        {
          text: 'View Plans',
          onPress: () => {
            // Reset form dan navigate back to Plans
            setSelectedImage(null);
            navigation.navigate('Plans', { refresh: true });
          },
        },
        {
          text: 'Upload Another',
          style: 'cancel',
          onPress: () => {
            setSelectedImage(null);
          },
        },
      ]);
    } catch (error: any) {
      console.error('❌ Upload Error:', error);
      setErrorUpload(error.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#8B4A6B" />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons name="cloud-upload" size={32} color="#8B4A6B" />
            </View>
          </View>
          <Text style={styles.title}>Upload Meal Photo</Text>
          <Text style={styles.subtitle}>Upload your meal photo for "{planName}"</Text>

          {/* Plans Info */}
          <View style={styles.planInfo}>
            <Ionicons name="restaurant" size={16} color="#8B4A6B" />
            <Text style={styles.planInfoText}>Plan ID: {plansId}</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Image Selection */}
          <View style={styles.imageSection}>
            <Text style={styles.inputLabel}>Select Your Meal Photo</Text>

            {selectedImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}>
                  <Ionicons name="close-circle" size={24} color="#FF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.imagePlaceholder} onPress={showImagePickerOptions}>
                <Ionicons name="camera" size={48} color="#8B4A6B" />
                <Text style={styles.placeholderText}>Tap to select photo</Text>
                <Text style={styles.placeholderSubtext}>Camera or Gallery</Text>
              </TouchableOpacity>
            )}

            {/* Image Selection Buttons */}
            {!selectedImage && (
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.imageButton} onPress={pickImageFromGallery}>
                  <Ionicons name="images" size={20} color="#8B4A6B" />
                  <Text style={styles.imageButtonText}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.imageButton} onPress={takePhotoWithCamera}>
                  <Ionicons name="camera" size={20} color="#8B4A6B" />
                  <Text style={styles.imageButtonText}>Camera</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Change Photo Button - when image is selected */}
            {selectedImage && (
              <TouchableOpacity style={styles.changePhotoButton} onPress={showImagePickerOptions}>
                <Ionicons name="swap-horizontal" size={20} color="#8B4A6B" />
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Error Message */}
          {errorUpload && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#FF4444" />
              <Text style={styles.errorText}>{errorUpload}</Text>
            </View>
          )}

          {/* Upload Button */}
          <TouchableOpacity
            onPress={uploadImage}
            activeOpacity={0.8}
            style={[styles.uploadButtonContainer, isUploading && styles.disabledButton]}
            disabled={isUploading || !selectedImage}>
            <LinearGradient
              colors={
                selectedImage && !isUploading ? ['#8B4A6B', '#A855F7'] : ['#9CA3AF', '#9CA3AF']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.uploadButton}>
              {isUploading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.uploadButtonText}>Uploading...</Text>
                </View>
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload"
                    size={20}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.uploadButtonText}>
                    {selectedImage ? 'Upload Photo' : 'Select Photo First'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Info */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              Your photo will be associated with this meal plan and can be used for meal tracking
              and analysis.
            </Text>
          </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    shadowColor: '#8B4A6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  planInfoText: {
    fontSize: 14,
    color: '#8B4A6B',
    fontWeight: '600',
  },
  form: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
    textAlign: 'center',
  },
  imageSection: {
    marginBottom: 20,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  imagePreview: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    backgroundColor: '#F7FAFC',
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  imagePlaceholder: {
    height: 250,
    backgroundColor: '#F7FAFC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  placeholderText: {
    fontSize: 18,
    color: '#8B4A6B',
    marginTop: 12,
    fontWeight: '600',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  imageButtonText: {
    fontSize: 16,
    color: '#8B4A6B',
    fontWeight: '600',
    marginLeft: 8,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4F8',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
    marginBottom: 20,
  },
  changePhotoText: {
    fontSize: 16,
    color: '#8B4A6B',
    fontWeight: '600',
    marginLeft: 8,
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
  uploadButtonContainer: {
    marginBottom: 30,
  },
  disabledButton: {
    opacity: 0.6,
  },
  uploadButton: {
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#8B4A6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    gap: 8,
  },
  infoText: {
    color: '#0C4A6E',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
