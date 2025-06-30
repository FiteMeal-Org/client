import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

export default function ProfileFormScreen({
    navigation,
}: {
    navigation: StackNavigationProp<any>;
}) {
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');
    const [userId, setUserId] = useState<string | null>(null);

    // Profile form data - simplified to only required fields
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [activityLevel, setActivityLevel] = useState('');

    // Check if user profile is already complete
    useEffect(() => {
        checkUserProfile();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const checkUserProfile = async () => {
        try {
            setInitialLoading(true);

            // Get user ID from secure store
            const storedUserId = await SecureStore.getItemAsync('user_id');
            const token = await AsyncStorage.getItem('userToken');

            if (!storedUserId || !token) {
                Alert.alert('Error', 'Session expired. Please login again.');
                navigation.navigate('Login');
                return;
            }

            setUserId(storedUserId);

            // Get user profile from backend
            const response = await axios.get(`${API_CONFIG.BASE_URL}/api/profiles/${storedUserId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const profile = response.data.data || response.data;

            // Check if profile is complete (height, weight, activityLevel)
            if (profile.height && profile.weight && profile.activityLevel) {
                // Profile is already complete
                await AsyncStorage.setItem('profileCompleted', 'true');
                Alert.alert(
                    'Profil Sudah Lengkap',
                    'Profil Anda sudah lengkap. Anda akan diarahkan kembali.',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.goBack(),
                        },
                    ]
                );
                return;
            }

            // Pre-fill form if data exists
            if (profile.height) setHeight(profile.height.toString());
            if (profile.weight) setWeight(profile.weight.toString());
            if (profile.activityLevel) setActivityLevel(profile.activityLevel);
        } catch (error: any) {
            console.log('Profile check error:', error.response?.data);
            // If profile doesn't exist or error, continue with form
        } finally {
            setInitialLoading(false);
        }
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

        try {
            const token = await AsyncStorage.getItem('userToken');

            if (!userId || !token) {
                Alert.alert('Error', 'Session expired. Please login again.');
                navigation.navigate('Login');
                return;
            }

            const response = await axios.patch(
                `${API_CONFIG.BASE_URL}/api/profiles/${userId}`,
                {
                    height: parseFloat(height),
                    weight: parseFloat(weight),
                    activityLevel,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log('Profile saved successfully:', response.data);

            // Update local storage to mark profile as complete
            await AsyncStorage.setItem('profileCompleted', 'true');

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
            console.log('Profile Error:', error.response?.data);
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
                        <ActivityIndicator size="large" color="#8B4A6B" />
                        <Text style={styles.loadingText}>Memeriksa profil Anda...</Text>
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled">
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.logoContainer}>
                                <View style={styles.logo}>
                                    <Ionicons name="person-add" size={32} color="#8B4A6B" />
                                </View>
                            </View>
                            <Text style={styles.title}>Lengkapi Profil Anda</Text>
                            <Text style={styles.subtitle}>
                                Kami perlu informasi tambahan untuk memberikan rekomendasi meal plan yang tepat
                            </Text>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            {/* Height */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Tinggi Badan (cm)</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons
                                        name="resize-outline"
                                        size={20}
                                        color="#8B4A6B"
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
                                        color="#8B4A6B"
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
                                        color="#8B4A6B"
                                        style={styles.inputIcon}
                                    />
                                    <View style={styles.pickerWrapper}>
                                        <Picker
                                            selectedValue={activityLevel}
                                            style={styles.picker}
                                            onValueChange={(itemValue) => setActivityLevel(itemValue)}
                                            dropdownIconColor="#8B4A6B">
                                            <Picker.Item label="Pilih tingkat aktivitas" value="" />
                                            <Picker.Item label="Inactive (Tidak Aktif)" value="inactive" />
                                            <Picker.Item label="Somewhat Active (Agak Aktif)" value="somewhat_active" />
                                            <Picker.Item label="Active (Aktif)" value="active" />
                                            <Picker.Item label="Very Active (Sangat Aktif)" value="very_active" />
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

                            {/* Save Button */}
                            <TouchableOpacity
                                onPress={handleSaveProfile}
                                activeOpacity={0.8}
                                style={styles.saveButtonContainer}
                                disabled={loading}>
                                <LinearGradient
                                    colors={['#8B4A6B', '#A855F7']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.saveButton}>
                                    <Text style={styles.saveButtonText}>
                                        {loading ? 'Menyimpan...' : 'Simpan Profil'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                )}
            </SafeAreaView>
        </>
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
        paddingHorizontal: 24,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#8B4A6B',
        textAlign: 'center',
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
    unitText: {
        fontSize: 14,
        color: '#8B4A6B',
        fontWeight: '500',
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
        borderRadius: 12,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: '#8B4A6B',
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
});
