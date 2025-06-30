import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type MealExercisePlanScreenProps = {
    navigation: any;
};

export default function MealExercisePlanScreen({ navigation }: MealExercisePlanScreenProps) {
    const [progressPercentage] = useState(100);
    const [completedMeals] = useState(3);
    const [totalMeals] = useState(3);

    const handleGoBack = () => {
        navigation.goBack();
    };

    const handleCreateMealPlan = () => {
        navigation.navigate('Add');
    };

    const handleCreateExercisePlan = () => {
        navigation.navigate('AddExercise');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Meal & Exercise Plan</Text>
                    <TouchableOpacity style={styles.menuButton}>
                        <Ionicons name="menu" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* Daily Progress Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.mainTitle}>Your Progress Today</Text>
                    <Text style={styles.subtitle}>Track your nutrition and fitness goals</Text>
                </View>

                {/* Calorie Cards */}
                <View style={styles.calorieCardsContainer}>
                    {/* Intake Calories Card */}
                    <View style={styles.calorieCard}>
                        <View style={styles.cardHeader}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="bar-chart" size={20} color="#22C55E" />
                            </View>
                            <Text style={styles.cardLabel}>Intake Calories</Text>
                        </View>
                        <Text style={styles.calorieNumber}>2,005</Text>
                        <View style={styles.progressBarContainer}>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
                            </View>
                            <Text style={styles.progressText}>{progressPercentage.toFixed(0)}% of target</Text>
                        </View>
                        <Text style={styles.mealsCompleted}>{completedMeals}/{totalMeals} meals completed</Text>
                    </View>

                    {/* Target Calories Card */}
                    <View style={styles.calorieCard}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                                <Ionicons name="flag" size={20} color="#F59E0B" />
                            </View>
                            <Text style={styles.cardLabel}>Target Calories</Text>
                        </View>
                        <Text style={[styles.calorieNumber, { color: '#F59E0B' }]}>2,005</Text>
                        <View style={styles.goalContainer}>
                            <Text style={styles.goalLabel}>Daily Goal</Text>
                            <Text style={styles.remainingText}>0 remaining</Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsSection}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                    {/* Create Meal Plan Button */}
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleCreateMealPlan}
                        activeOpacity={0.8}>
                        <LinearGradient
                            colors={['#22C55E', '#16A34A']}
                            style={styles.actionGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}>
                            <View style={styles.actionContent}>
                                <View style={styles.actionIcon}>
                                    <Ionicons name="restaurant" size={28} color="white" />
                                </View>
                                <View style={styles.actionTextContainer}>
                                    <Text style={styles.actionTitle}>Create Meal & Exercise Plan</Text>
                                    <Text style={styles.actionDescription}>Plan your exercises and meals</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="white" />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Create Exercise Plan Button */}
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleCreateExercisePlan}
                        activeOpacity={0.8}>
                        <LinearGradient
                            colors={['#8B4A6B', '#6B3252']}
                            style={styles.actionGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}>
                            <View style={styles.actionContent}>
                                <View style={styles.actionIcon}>
                                    <Ionicons name="fitness" size={28} color="white" />
                                </View>
                                <View style={styles.actionTextContainer}>
                                    <Text style={styles.actionTitle}>Create Exercise Plan</Text>
                                    <Text style={styles.actionDescription}>Design your workout routine</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="white" />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Stats Overview */}
                <View style={styles.statsSection}>
                    <Text style={styles.sectionTitle}>Weekly Overview</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <View style={styles.statIconContainer}>
                                <Ionicons name="flame" size={24} color="#EF4444" />
                            </View>
                            <Text style={styles.statValue}>1,240</Text>
                            <Text style={styles.statLabel}>Calories Burned</Text>
                        </View>
                        <View style={styles.statItem}>
                            <View style={styles.statIconContainer}>
                                <Ionicons name="time" size={24} color="#3B82F6" />
                            </View>
                            <Text style={styles.statValue}>5.2</Text>
                            <Text style={styles.statLabel}>Hours Active</Text>
                        </View>
                        <View style={styles.statItem}>
                            <View style={styles.statIconContainer}>
                                <Ionicons name="trophy" size={24} color="#F59E0B" />
                            </View>
                            <Text style={styles.statValue}>85%</Text>
                            <Text style={styles.statLabel}>Goals Met</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
    },
    menuButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
    },
    titleSection: {
        paddingHorizontal: 20,
        paddingVertical: 25,
        backgroundColor: 'white',
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
    },
    calorieCardsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 25,
    },
    calorieCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#DCFCE7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    cardLabel: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    calorieNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#22C55E',
        marginBottom: 15,
    },
    progressBarContainer: {
        marginBottom: 12,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#22C55E',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    mealsCompleted: {
        fontSize: 12,
        color: '#64748B',
    },
    goalContainer: {
        backgroundColor: '#FEF3C7',
        borderRadius: 8,
        padding: 12,
        marginTop: 10,
    },
    goalLabel: {
        fontSize: 12,
        color: '#92400E',
        fontWeight: '500',
        marginBottom: 4,
    },
    remainingText: {
        fontSize: 14,
        color: '#92400E',
        fontWeight: '600',
    },
    actionsSection: {
        paddingHorizontal: 20,
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 15,
    },
    actionButton: {
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    actionGradient: {
        padding: 20,
    },
    actionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    actionTextContainer: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginBottom: 4,
    },
    actionDescription: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    statsSection: {
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    statItem: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
    },
});
