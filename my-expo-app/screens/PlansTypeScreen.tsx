import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';

export default function PlansTypeScreen() {
  const navigation = useNavigation();

  const planTypes = [
    {
      id: 'meal',
      title: 'Meal Plans',
      description: 'Track your daily nutrition and meal schedules',
      icon: '🍽️',
      color: '#4CAF50',
      backgroundColor: '#E8F5E8',
      screen: 'PlansScreen',
    },
    {
      id: 'exercise',
      title: 'Exercise Plans',
      description: 'Follow your workout routines and track progress',
      icon: '💪',
      color: '#FF9800',
      backgroundColor: '#FFF3E0',
      screen: 'ExercisePlansScreen',
    },
    {
      id: 'combined',
      title: 'Meal + Exercise Plans',
      description: 'Complete wellness program with nutrition and fitness',
      icon: '⚡',
      color: '#9C27B0',
      backgroundColor: '#F3E5F5',
      screen: 'MealExercisePlan',
    },
  ];

  const handlePlanSelect = (screenName: string) => {
    if (screenName === 'MealExercisePlan') {
      // Navigate to combined plan screen
      navigation.navigate(screenName as never);
    } else {
      navigation.navigate(screenName as never);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Home' as never)}
          style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Choose Your Plan</Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}>
        <Text style={styles.subtitle}>Select the type of plan you want to manage and track</Text>

        {planTypes.map((planType) => (
          <TouchableOpacity
            key={planType.id}
            style={[styles.planTypeCard, { backgroundColor: planType.backgroundColor }]}
            onPress={() => handlePlanSelect(planType.screen)}>
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: planType.color }]}>
                  <Text style={styles.cardIcon}>{planType.icon}</Text>
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={[styles.cardTitle, { color: planType.color }]}>
                    {planType.title}
                  </Text>
                  <Text style={styles.cardDescription}>{planType.description}</Text>
                </View>
              </View>
              <View style={[styles.arrowContainer, { backgroundColor: planType.color }]}>
                <Text style={styles.arrowIcon}>→</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Tips</Text>
          <Text style={styles.infoText}>
            • Start with meal plans if you're focusing on nutrition
          </Text>
          <Text style={styles.infoText}>• Choose exercise plans for fitness goals</Text>
          <Text style={styles.infoText}>• Combine both for complete wellness transformation</Text>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#333333',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  placeholder: {
    width: 40,
  },

  // Content
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Add extra padding for better scrolling
    flexGrow: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },

  // Plan Type Cards
  planTypeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  arrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Info Card
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 4,
    lineHeight: 20,
  },
});
