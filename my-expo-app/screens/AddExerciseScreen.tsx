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
    Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddExerciseScreen({ navigation }: { navigation: any }) {
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [goals, setGoals] = useState('');
    const [exerciseLevel, setExerciseLevel] = useState('');
    const [duration, setDuration] = useState('');

    const handleCreatePlan = () => {
        // Validasi form
        if (!name.trim()) {
            Alert.alert('Error', 'Exercise plan name is required');
            return;
        }

        if (!goals) {
            Alert.alert('Error', 'Please select a goal');
            return;
        }

        if (!exerciseLevel) {
            Alert.alert('Error', 'Please select exercise level');
            return;
        }

        if (!duration) {
            Alert.alert('Error', 'Please select duration');
            return;
        }

        // Data exercise plan
        const exercisePlan = {
            name: name.trim(),
            startDate: startDate.toISOString().split('T')[0],
            goals,
            exerciseLevel,
            duration: duration
        };

        Alert.alert('Success', 'Exercise plan created successfully!');
        console.log('Exercise Plan Data:', exercisePlan);
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

    const getExercisesByGoal = (goal: string) => {
        const exercises = {
            bulking: ['Bench Press', 'Deadlift', 'Squats', 'Pull-ups', 'Overhead Press'],
            cutting: ['HIIT Cardio', 'Running', 'Cycling', 'Jump Rope', 'Circuit Training'],
            fat_loss: ['Burpees', 'Mountain Climbers', 'High Knees', 'Plank', 'Jumping Jacks'],
            maintain: ['Push-ups', 'Yoga', 'Walking', 'Swimming', 'Bodyweight Squats'],
            muscle_gain: ['Barbell Rows', 'Dumbbell Press', 'Leg Press', 'Bicep Curls', 'Tricep Dips']
        };
        return exercises[goal as keyof typeof exercises] || [];
    };

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
                            <View style={styles.headerActions}>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Login')}
                                    style={styles.headerButton}
                                >
                                    <Text style={styles.headerButtonText}>Login</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Register')}
                                    style={[styles.headerButton, styles.headerButtonSecondary]}
                                >
                                    <Text style={styles.headerButtonTextSecondary}>Register</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('ProfilePage')}
                                    style={styles.profileButton}
                                >
                                    <Ionicons name="person-circle-outline" size={24} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
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
                                <Picker.Item label="Bulking (Build Muscle)" value="bulking" />
                                <Picker.Item label="Cutting (Lean Down)" value="cutting" />
                                <Picker.Item label="Fat Loss" value="fat_loss" />
                                <Picker.Item label="Maintain Weight" value="maintain" />
                                <Picker.Item label="Muscle Gain" value="muscle_gain" />
                            </Picker>
                        </View>

                        {/* Recommended Exercises */}
                        {goals && (
                            <View style={styles.recommendedSection}>
                                <Text style={styles.inputLabel}>Recommended Exercises</Text>
                                <View style={styles.exercisesList}>
                                    {getExercisesByGoal(goals).map((exercise, index) => (
                                        <View key={index} style={styles.exerciseItem}>
                                            <Ionicons name="fitness-outline" size={16} color="#8B0000" />
                                            <Text style={styles.exerciseText}>{exercise}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Exercise Level */}
                        <Text style={styles.inputLabel}>Exercise Level</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={exerciseLevel}
                                style={styles.picker}
                                onValueChange={(itemValue) => setExerciseLevel(itemValue)}
                                dropdownIconColor="#999"
                            >
                                <Picker.Item label="Select your level..." value="" />
                                <Picker.Item label="Beginner" value="beginner" />
                                <Picker.Item label="Intermediate" value="intermediate" />
                                <Picker.Item label="Advanced" value="advanced" />
                                <Picker.Item label="Expert" value="expert" />
                            </Picker>
                        </View>

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
                        <TouchableOpacity onPress={handleCreatePlan} activeOpacity={0.8}>
                            <LinearGradient
                                colors={['#8B0000', '#DC143C', '#FF6B6B']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.createButton}
                            >
                                <Text style={styles.createButtonText}>Create My Exercise Plan</Text>
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
});