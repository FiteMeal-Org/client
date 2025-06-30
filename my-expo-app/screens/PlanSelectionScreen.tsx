import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ImageBackground,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type PlanSelectionScreenProps = {
    navigation: any;
};

export default function PlanSelectionScreen({ navigation }: PlanSelectionScreenProps) {
    const handleExercisePlanPress = () => {
        navigation.navigate('AddExercise');
    };

    const handleMealExercisePlanPress = () => {
        navigation.navigate('Add'); // Navigate to existing meal plan screen
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    return (
        <ImageBackground
            source={{
                uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
            }}
            style={styles.background}
            resizeMode="cover">
            <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                style={styles.overlay}
            />

            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Choose Your Plan</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <View style={styles.titleSection}>
                        <Text style={styles.mainTitle}>What Would You Like to Create?</Text>
                        <Text style={styles.subtitle}>
                            Choose the type of plan that fits your fitness goals
                        </Text>
                    </View>

                    <View style={styles.optionsContainer}>
                        {/* Exercise Plan Option */}
                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={handleExercisePlanPress}
                            activeOpacity={0.8}>
                            <LinearGradient
                                colors={['rgba(34, 197, 94, 0.9)', 'rgba(21, 128, 61, 0.9)']}
                                style={styles.optionGradient}>
                                <View style={styles.optionContent}>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="fitness" size={40} color="white" />
                                    </View>
                                    <Text style={styles.optionTitle}>Create Exercise Plan</Text>
                                    <Text style={styles.optionDescription}>
                                        Generate a personalized workout routine based on your goals and preferences
                                    </Text>
                                    <View style={styles.featuresContainer}>
                                        <Text style={styles.feature}>• Custom workout routines</Text>
                                        <Text style={styles.feature}>• Goal-based exercises</Text>
                                        <Text style={styles.feature}>• Flexible duration</Text>
                                    </View>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Meal & Exercise Plan Option */}
                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={handleMealExercisePlanPress}
                            activeOpacity={0.8}>
                            <LinearGradient
                                colors={['rgba(139, 74, 107, 0.9)', 'rgba(101, 54, 78, 0.9)']}
                                style={styles.optionGradient}>
                                <View style={styles.optionContent}>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="restaurant" size={40} color="white" />
                                    </View>
                                    <Text style={styles.optionTitle}>Create Meal & Exercise Plan</Text>
                                    <Text style={styles.optionDescription}>
                                        Get a complete nutrition and workout plan for optimal results
                                    </Text>
                                    <View style={styles.featuresContainer}>
                                        <Text style={styles.feature}>• Nutrition planning</Text>
                                        <Text style={styles.feature}>• Meal recommendations</Text>
                                        <Text style={styles.feature}>• Integrated with workouts</Text>
                                    </View>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    titleSection: {
        marginBottom: 40,
        alignItems: 'center',
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 22,
    },
    optionsContainer: {
        flex: 1,
        gap: 20,
    },
    optionCard: {
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    optionGradient: {
        padding: 25,
        minHeight: 200,
    },
    optionContent: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    optionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 10,
    },
    optionDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 15,
    },
    featuresContainer: {
        alignItems: 'flex-start',
        width: '100%',
    },
    feature: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 5,
    },
});
