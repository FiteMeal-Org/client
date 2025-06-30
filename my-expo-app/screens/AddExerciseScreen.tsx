import React, { useState, useEffect, useCallback } from 'react';
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
    ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_CONFIG, getApiUrl } from '../config/api';

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

export default function AddExerciseScreen({ navigation }: { navigation: any }) {
    // Form state
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [equipment, setEquipment] = useState('');
    const [goals, setGoals] = useState('');
    const [duration, setDuration] = useState('');

    // Loading and profile state
    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [userId, setUserId] = useState('');

    const loadUserProfile = useCallback(async () => {
        try {
            setProfileLoading(true);
            const storedUserId = await SecureStore.getItemAsync('user_id');
            const token = await SecureStore.getItemAsync('access_token');

            console.log('📱 Stored User ID:', storedUserId);
            console.log('🔑 Token exists:', !!token);
            console.log('🔑 Token length:', token?.length);

            if (!storedUserId) {
                console.warn('⚠️ No user ID found in SecureStore');
                // Instead of showing error, create a default profile for demo
                setUserProfile({
                    id: 'demo-user',
                    username: 'Demo User',
                    email: 'demo@example.com',
                    age: 25,
                    height: 170,
                    weight: 70,
                    goals: 'weight_loss',
                    activity_level: 'moderate',
                    gender: 'male'
                });
                setUserId('demo-user');
                setProfileLoading(false);
                return;
            }

            if (!token) {
                console.warn('⚠️ No authentication token found');
                // Use demo profile if no token
                setUserProfile({
                    id: storedUserId,
                    username: 'Demo User',
                    email: 'demo@example.com',
                    age: 25,
                    height: 170,
                    weight: 70,
                    goals: 'weight_loss',
                    activity_level: 'moderate',
                    gender: 'male'
                });
                setUserId(storedUserId);
                setProfileLoading(false);
                return;
            }

            setUserId(storedUserId);

            console.log('🔗 API URL:', getApiUrl(API_CONFIG.ENDPOINTS.PROFILE_BY_ID(storedUserId)));
            console.log('🔑 Making API request with token...');

            const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.PROFILE_BY_ID(storedUserId)), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📊 API Response:', response.data);

            if (response.data && response.data.data) {
                setUserProfile(response.data.data);
            } else {
                // Fallback to demo profile if API returns no data
                console.warn('⚠️ No profile data from API, using demo profile');
                setUserProfile({
                    id: storedUserId,
                    username: 'User',
                    email: 'user@example.com',
                    age: 25,
                    height: 170,
                    weight: 70,
                    goals: 'weight_loss',
                    activity_level: 'moderate',
                    gender: 'male'
                });
            }
        } catch (error: any) {
            console.error('❌ Error loading user profile:', error);
            console.error('❌ Error details:', error.response?.data || error.message);

            // Instead of showing error alert, provide fallback
            console.log('🔄 Using fallback demo profile');
            setUserProfile({
                id: userId || 'demo-user',
                username: 'Demo User',
                email: 'demo@example.com',
                age: 25,
                height: 170,
                weight: 70,
                goals: 'weight_loss',
                activity_level: 'moderate',
                gender: 'male'
            });
        } finally {
            setProfileLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        const initProfile = async () => {
            await loadUserProfile();
        };
        initProfile();
    }, [loadUserProfile]);

    const handleCreatePlan = async () => {
        // Validasi form
        if (!name.trim()) {
            Alert.alert('Error', 'Exercise plan name is required');
            return;
        }

        if (!equipment.trim()) {
            Alert.alert('Error', 'Please enter equipment needed');
            return;
        }

        if (!goals) {
            Alert.alert('Error', 'Please select a goal');
            return;
        }

        if (!duration) {
            Alert.alert('Error', 'Please select duration');
            return;
        }

        if (!userProfile) {
            Alert.alert('Error', 'User profile not loaded');
            return;
        }

        try {
            setLoading(true);

            // Get authentication token
            const token = await SecureStore.getItemAsync('access_token');

            if (!token) {
                Alert.alert('Error', 'Authentication token not found. Please login again.');
                return;
            }

            const exerciseData = {
                userId: userId,
                name: name.trim(),
                startDate: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
                age: userProfile.age || 25,
                weight: userProfile.weight || 70,
                height: userProfile.height || 170,
                gender: userProfile.gender || 'other',
                equipment: equipment.trim(),
                goals: goals,
                duration: parseInt(duration),
            };

            console.log('Submitting exercise data:', exerciseData);

            const response = await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.EXERCISE), exerciseData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data) {
                Alert.alert(
                    'Success',
                    'Exercise plan created successfully!',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.navigate('Home'),
                        },
                    ]
                );
            }
        } catch (error: any) {
            console.error('Error creating exercise plan:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to create exercise plan';
            Alert.alert('Error', errorMessage);
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
            day: 'numeric'
        });
    };

    if (profileLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B0000" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 1 }}>
                {/* Hero Image dengan Header */}
                <View style={styles.imageHeaderContainer}>
                    <ImageBackground
                        source={{ uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop' }}
                        style={styles.imageHeader}
                    >
                        <LinearGradient
                            colors={[
                                'rgba(255,255,255,0)',
                                'rgba(255,255,255,0)',
                                'rgba(255,255,255,0.3)',
                                'rgba(255,255,255,0.6)',
                                'rgba(255,255,255,0.85)',
                                'rgba(248,249,250,1)'
                            ]}
                            locations={[0, 0.4, 0.6, 0.75, 0.9, 1]}
                            style={styles.imageGradient}
                        />

                        {/* Header Navigation */}
                        <View style={styles.headerOverlay}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={styles.backButton}
                            >
                                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Create Exercise Plan</Text>
                            <View style={styles.placeholder} />
                        </View>

                        {/* Hero Content */}
                        <View style={styles.headerContent}>
                            <Text style={styles.title}>Build Your Workout Plan</Text>
                            <Text style={styles.subtitle}>
                                Create a personalized exercise routine that matches your fitness goals
                            </Text>
                        </View>
                    </ImageBackground>
                </View>

                {/* Form Section */}
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.form}>
                        {/* User Profile Display */}
                        {userProfile && (
                            <View style={styles.userInfoCard}>
                                <Text style={styles.inputLabel}>Your Profile Information</Text>
                                <View style={styles.userInfoGrid}>
                                    <View style={styles.userInfoItem}>
                                        <Text style={styles.userInfoLabel}>Age</Text>
                                        <Text style={styles.userInfoValue}>{userProfile.age || 'Not set'}</Text>
                                    </View>
                                    <View style={styles.userInfoItem}>
                                        <Text style={styles.userInfoLabel}>Weight</Text>
                                        <Text style={styles.userInfoValue}>{userProfile.weight || 'Not set'} kg</Text>
                                    </View>
                                    <View style={styles.userInfoItem}>
                                        <Text style={styles.userInfoLabel}>Height</Text>
                                        <Text style={styles.userInfoValue}>{userProfile.height || 'Not set'} cm</Text>
                                    </View>
                                    <View style={styles.userInfoItem}>
                                        <Text style={styles.userInfoLabel}>Gender</Text>
                                        <Text style={styles.userInfoValue}>{userProfile.gender || 'Not set'}</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Plan Name */}
                        <Text style={styles.inputLabel}>Exercise Plan Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., My Strength Building Journey"
                            placeholderTextColor="#999"
                            value={name}
                            onChangeText={setName}
                        />

                        {/* Start Date */}
                        <Text style={styles.inputLabel}>Start Date</Text>
                        <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => setShowDatePicker(true)}
                        >
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

                        {/* Goals */}
                        <Text style={styles.inputLabel}>Fitness Goal</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={goals}
                                style={styles.picker}
                                onValueChange={(itemValue) => setGoals(itemValue)}
                                dropdownIconColor="#999"
                            >
                                <Picker.Item label="Select your goal..." value="" />
                                <Picker.Item label="Bulking" value="bulking" />
                                <Picker.Item label="Fat Loss" value="fat loss" />
                                <Picker.Item label="Maintain" value="maintain" />
                            </Picker>
                        </View>

                        {/* Equipment */}
                        <Text style={styles.inputLabel}>Equipment Needed</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Dumbbells, Barbell, Bodyweight only"
                            placeholderTextColor="#999"
                            value={equipment}
                            onChangeText={setEquipment}
                            multiline
                            numberOfLines={3}
                        />

                        {/* Duration */}
                        <Text style={styles.inputLabel}>Plan Duration</Text>
                        <View style={styles.durationContainer}>
                            {['3', '5', '7'].map((days) => (
                                <TouchableOpacity
                                    key={days}
                                    style={[
                                        styles.durationOption,
                                        duration === days && styles.durationOptionSelected
                                    ]}
                                    onPress={() => setDuration(days)}
                                >
                                    <Text style={[
                                        styles.durationOptionText,
                                        duration === days && styles.durationOptionTextSelected
                                    ]}>
                                        {days} Days
                                    </Text>
                                    <Text style={[
                                        styles.durationSubtext,
                                        duration === days && styles.durationSubtextSelected
                                    ]}>
                                        {days === '3' ? 'Starter' : days === '5' ? 'Regular' : 'Intensive'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Create Button */}
                        <TouchableOpacity
                            onPress={handleCreatePlan}
                            activeOpacity={0.8}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={loading ? ['#888', '#666'] : ['#8B0000', '#DC143C', '#FF6B6B']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.createButton}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.createButtonText}>Create My Exercise Plan</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Bottom Navigation */}
                        <View style={styles.bottomRegisterContainer}>
                            <Text style={styles.bottomRegisterText}>Want to create meal plan? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('AddScreen')}>
                                <Text style={styles.bottomRegisterLink}>Add Meal Plan</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.bottomRegisterContainer}>
                            <Text style={styles.bottomRegisterText}>View your profile? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('ProfilePage')}>
                                <Text style={styles.bottomRegisterLink}>My Profile</Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    loadingText: {
        color: '#8B0000',
        marginTop: 10,
        fontSize: 16,
    },
    placeholder: {
        width: 40,
    },
    userInfoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E9ECEF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    userInfoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    userInfoItem: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 8,
    },
    userInfoLabel: {
        fontSize: 12,
        color: '#6C757D',
        fontWeight: '600',
        marginBottom: 4,
    },
    userInfoValue: {
        fontSize: 14,
        color: '#2C3E50',
        fontWeight: '600',
    },
});