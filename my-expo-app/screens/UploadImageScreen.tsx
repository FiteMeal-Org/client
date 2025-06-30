import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
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
import { AuthContext } from '../App';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

export default function UploadImageScreen({
    navigation,
}: {
    navigation: StackNavigationProp<any>;
}) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [plansId, setPlansId] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [errorUpload, setErrorUpload] = useState('');

    const { token } = useContext(AuthContext);

    // Request permission untuk camera dan gallery
    const requestPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Kami memerlukan izin untuk mengakses galeri foto!');
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
            Alert.alert('Permission Denied', 'Kami memerlukan izin untuk mengakses kamera!');
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
        Alert.alert('Pilih Sumber Gambar', 'Pilih dari mana Anda ingin mengambil foto bahan makanan', [
            { text: 'Kamera', onPress: takePhotoWithCamera },
            { text: 'Galeri', onPress: pickImageFromGallery },
            { text: 'Batal', style: 'cancel' },
        ]);
    };

    // Upload image dan generate menu baru
    const uploadImageAndGenerateMenu = async () => {
        setErrorUpload('');
        setIsUploading(true);

        // Validasi
        if (!selectedImage) {
            setErrorUpload('Silakan pilih foto bahan makanan terlebih dahulu');
            setIsUploading(false);
            return;
        }

        if (!plansId.trim()) {
            setErrorUpload('Plans ID harus diisi');
            setIsUploading(false);
            return;
        }

        try {
            // Get userId from SecureStore
            const userId = await SecureStore.getItemAsync('user_id');

            if (!userId) {
                throw new Error('User ID tidak ditemukan. Silakan login ulang.');
            }

            // Buat FormData untuk upload
            const formData = new FormData();

            // Append image file dengan key 'photo'
            formData.append('photo', {
                uri: selectedImage,
                type: 'image/jpeg',
                name: 'ingredients-photo.jpg',
            } as any);

            // Append userId dan plansId dari SecureStore
            formData.append('userId', userId);
            formData.append('plansId', plansId);

            console.log('Uploading ingredients image and generating new menu...');
            console.log('User ID:', userId);
            console.log('Plans ID:', plansId);

            // Menggunakan axios instead of fetch
            const response = await axios.post(`${API_CONFIG.BASE_URL}/api/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log('Upload & Generate Success:', response.data);
            Alert.alert(
                'Berhasil!',
                'Foto bahan makanan berhasil diupload dan menu baru sedang digenerate. Silakan cek menu terbaru Anda!',
                [
                    {
                        text: 'Lihat Menu Baru',
                        onPress: () => {
                            // Reset form
                            setSelectedImage(null);
                            setPlansId('');
                            // Navigate ke halaman menu atau home
                            navigation.navigate('BerandaNavigator', {
                                screen: 'Home',
                                params: { refresh: true },
                            });
                        },
                    },
                    {
                        text: 'Upload Lagi',
                        style: 'cancel',
                        onPress: () => {
                            setSelectedImage(null);
                            setPlansId('');
                        },
                    },
                ]
            );
        } catch (error: any) {
            console.log('Upload Error:', error);
            // Axios error handling
            if (error.response) {
                // Server responded with error status
                setErrorUpload(error.response.data?.message || 'Upload gagal. Silakan coba lagi.');
            } else if (error.request) {
                // Request was made but no response received
                setErrorUpload('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
            } else {
                // Something else happened
                setErrorUpload(error.message || 'Upload gagal. Silakan coba lagi.');
            }
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logo}>
                            <Ionicons name="cloud-upload" size={32} color="#8B4A6B" />
                        </View>
                    </View>
                    <Text style={styles.title}>Upload Image</Text>
                    <Text style={styles.subtitle}>Upload your meal photo and associate it with a plan</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {/* Plans ID Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Plans ID</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="id-card-outline" size={20} color="#8B4A6B" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Plans ID"
                                placeholderTextColor="#999"
                                value={plansId}
                                onChangeText={setPlansId}
                            />
                        </View>
                    </View>

                    {/* Image Selection */}
                    <View style={styles.imageSection}>
                        <Text style={styles.inputLabel}>Select Image</Text>

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
                            <View style={styles.imagePlaceholder}>
                                <Ionicons name="image-outline" size={48} color="#999" />
                                <Text style={styles.placeholderText}>No image selected</Text>
                            </View>
                        )}

                        {/* Image Selection Buttons */}
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
                        onPress={uploadImageAndGenerateMenu}
                        activeOpacity={0.8}
                        style={[styles.uploadButtonContainer, isUploading && styles.disabledButton]}
                        disabled={isUploading}>
                        <LinearGradient
                            colors={['#8B4A6B', '#A855F7']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.uploadButton}>
                            {isUploading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Ionicons
                                        name="cloud-upload"
                                        size={20}
                                        color="#FFFFFF"
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text style={styles.uploadButtonText}>Upload Image</Text>
                                </>
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
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 30,
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
    },
    form: {
        flex: 1,
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
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
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
    imageSection: {
        marginBottom: 20,
    },
    imagePreviewContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        backgroundColor: '#F7FAFC',
    },
    removeImageButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    imagePlaceholder: {
        height: 200,
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    placeholderText: {
        fontSize: 16,
        color: '#999',
        marginTop: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
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
        marginBottom: 40,
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
});
