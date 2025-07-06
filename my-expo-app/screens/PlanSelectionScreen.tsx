import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  validateProfileForPlanCreation,
  showProfileIncompleteAlert,
  showProfileErrorAlert,
} from '../services/profileValidationService';
import { getUserProfile } from '../services/profileService';

type PlanSelectionScreenProps = {
  navigation: any;
};

export default function PlanSelectionScreen({ navigation }: PlanSelectionScreenProps) {
  const [user, setUser] = useState<any>(null);

  // Load user data to check premium status
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await getUserProfile();
        setUser(userData);
      } catch (error) {
        console.error('Error loading user data:', error);
        setUser(null);
      }
    };

    loadUserData();
  }, []);

  // Handle premium feature check
  const handlePremiumFeaturePress = (featureName: string, navigateCallback: () => void) => {
    if (!user?.isPremium) {
      Alert.alert(
        'Premium Feature',
        `${featureName} is a premium feature. Upgrade to access this functionality.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go Premium',
            onPress: () => navigation.navigate('Premium' as never),
          },
        ]
      );
      return;
    }

    // If premium user, proceed with navigation
    navigateCallback();
  };
  const validateAndNavigate = async (navigateCallback: () => void) => {
    try {
      console.log('🔍 PlanSelection: Starting profile validation...');
      const validation = await validateProfileForPlanCreation();

      if (validation.isValid) {
        console.log('✅ PlanSelection: Profile is valid, proceeding with navigation');
        navigateCallback();
      } else {
        console.log('❌ PlanSelection: Profile incomplete:', validation.missingFields);
        if (validation.missingFields.includes('profile_error')) {
          showProfileErrorAlert(navigation.getParent() || navigation);
        } else {
          showProfileIncompleteAlert(
            validation.missingFields,
            navigation.getParent() || navigation
          );
        }
      }
    } catch (error) {
      console.error('❌ PlanSelection: Error during validation:', error);
      showProfileErrorAlert(navigation.getParent() || navigation);
    }
  };

  const handleMealPlanPress = () => {
    validateAndNavigate(() => {
      // Navigate to the stack screen from tab navigator
      navigation.getParent()?.navigate('AddPlan');
    });
  };

  const handleExercisePlanPress = () => {
    handlePremiumFeaturePress('Exercise Plan', () => {
      validateAndNavigate(() => {
        // Navigate to the stack screen from tab navigator
        navigation.getParent()?.navigate('AddExercise');
      });
    });
  };

  const handleMealExercisePlanPress = () => {
    handlePremiumFeaturePress('Meal & Exercise Plan', () => {
      validateAndNavigate(() => {
        // Navigate to the stack screen from tab navigator
        navigation.getParent()?.navigate('AddMealExercisePlan');
      });
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}>
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>What Would You Like to Create?</Text>
          <Text style={styles.subtitle}>Choose the type of plan that fits your fitness goals</Text>
        </View>

        <View style={styles.optionsContainer}>
          {/* Meal Plan Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleMealPlanPress}
            activeOpacity={0.8}>
            <View style={styles.optionGradient}>
              <View style={styles.optionContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="restaurant-outline" size={40} color="#6366F1" />
                </View>
                <Text style={styles.optionTitle}>Create a Meal Plan</Text>
                <Text style={styles.optionDescription}>
                  Create a personalized meal plan based on your dietary goals and preferences
                </Text>
                <View style={styles.featuresContainer}>
                  <Text style={styles.feature}>• Customized nutrition</Text>
                  <Text style={styles.feature}>• Meal recommendations</Text>
                  <Text style={styles.feature}>• Calorie tracking</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Exercise Plan Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleExercisePlanPress}
            activeOpacity={0.8}>
            <View style={styles.optionGradient}>
              <View style={styles.optionContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="barbell-outline" size={40} color="black" />
                </View>
                <Text style={styles.optionTitle}>Create Exercise Plan</Text>
                <Text style={styles.optionDescription}>
                  Create a personalized workout routine based on your goals and preferences
                </Text>
                <View style={styles.featuresContainer}>
                  <Text style={styles.feature}>• Custom workout routines</Text>
                  <Text style={styles.feature}>• Goal-based exercises</Text>
                  <Text style={styles.feature}>• Flexible duration</Text>
                </View>
                {!user?.isPremium ? (
                  <View style={styles.premiumIndicator}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.premiumText}>PRO</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>

          {/* Meal & Exercise Plan Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleMealExercisePlanPress}
            activeOpacity={0.8}>
            <View style={styles.optionGradient}>
              <View style={styles.optionContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="fitness" size={40} color="#10B981" />
                </View>
                <Text style={styles.optionTitle}>Create Meal & Exercise Plan</Text>
                <Text style={styles.optionDescription}>
                  Create a complete nutrition and workout plan for optimal results
                </Text>
                <View style={styles.featuresContainer}>
                  <Text style={styles.feature}>• Complete wellness plan</Text>
                  <Text style={styles.feature}>• Integrated nutrition & fitness</Text>
                  <Text style={styles.feature}>• Comprehensive tracking</Text>
                </View>
                {!user?.isPremium ? (
                  <View style={styles.premiumIndicator}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.premiumText}>PRO</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 20,
    marginBottom: 20,
  },
  optionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    marginHorizontal: 4,
  },
  optionGradient: {
    padding: 24,
    minHeight: 180,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionContent: {
    alignItems: 'center',
    position: 'relative',
  },
  premiumIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  premiumText: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(226, 232, 240, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(203, 213, 225, 0.5)',
  },
  optionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#374151',
    marginBottom: 5,
    fontWeight: '500',
  },
});
