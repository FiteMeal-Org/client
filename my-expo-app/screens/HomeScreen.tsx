import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import {
  checkUserMealPlan,
  calculateTodayIntake,
  checkUserExercisePlan,
  checkUserMealExercisePlan,
  calculateMealExerciseTodayIntake,
} from '../services/mealPlanService';
import { getUserProfile } from '../services/profileService'; // Import profile service
import {
  validateProfileForPlanCreation,
  showProfileIncompleteAlert,
  showProfileErrorAlert,
} from '../services/profileValidationService';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();
  // State untuk meal plan dan calories
  const [hasMealPlan, setHasMealPlan] = useState(false);
  const [mealPlanCount, setMealPlanCount] = useState(0);
  const [mealPlanLoading, setMealPlanLoading] = useState(true);

  // State untuk exercise plan
  const [hasExercisePlan, setHasExercisePlan] = useState(false);
  const [exercisePlanCount, setExercisePlanCount] = useState(0);
  const [exercisePlanLoading, setExercisePlanLoading] = useState(true);

  // State untuk meal & exercise plan
  const [hasMealExercisePlan, setHasMealExercisePlan] = useState(false);
  const [mealExercisePlanCount, setMealExercisePlanCount] = useState(0);
  const [mealExercisePlanLoading, setMealExercisePlanLoading] = useState(true);

  // New states for calorie tracking
  const [intakeCalories, setIntakeCalories] = useState(0);
  const [targetCalories, setTargetCalories] = useState(0);
  const [intakePercentage, setIntakePercentage] = useState(0);
  const [remainingCalories, setRemainingCalories] = useState(0);
  const [completedMeals, setCompletedMeals] = useState(0);
  const [totalMeals, setTotalMeals] = useState(0);

  // Profile states
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // User state for premium check
  const [user, setUser] = useState<any>(null);

  // Existing state variables
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load profile data
  const loadProfileData = async () => {
    try {
      setProfileLoading(true);
      console.log('📱 HomeScreen: Loading profile data...');

      const profileData = await getUserProfile();
      console.log('📱 HomeScreen: Profile data received:', profileData);

      setProfile(profileData);
      setUser(profileData); // Set user data for premium check
    } catch (error) {
      // console.error('❌ HomeScreen: Error loading profile:', error);
      setProfile(null);
      setUser(null);
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle premium feature press
  const handlePremiumFeaturePress = (featureName: string) => {
    if (!user?.isPremium) {
      import('react-native').then(({ Alert }) => {
        Alert.alert(
          'Premium Feature',
          `${featureName} is a premium feature. Upgrade to access this functionality.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Go Premium', 
              onPress: () => navigation.navigate('Premium' as never) 
            },
          ]
        );
      });
      return;
    }
    
    // Handle navigation for premium users with profile validation
    if (featureName === 'Exercise Plan') {
      // Validate profile first, then navigate
      validateAndNavigate(() => {
        (navigation as any).navigate('BerandaNavigator', { screen: 'Add' });
      });
    } else if (featureName === 'Upload Photo') {
      // Validate profile first, then navigate to upload
      validateAndNavigate(() => {
        navigation.navigate('UploadImage' as never);
      });
    }
  };

  // Check meal plan status and calculate calories
  // Update checkMealPlanStatus function dengan debugging
  const checkMealPlanStatus = async () => {
    try {
      setMealPlanLoading(true);
      console.log('🔍 HomeScreen: Checking meal plan status...');

      // PASTIKAN await di sini
      const result = await checkUserMealPlan();

      console.log('📊 HomeScreen: Raw result received from API:', result);
      console.log('📊 HomeScreen: Result type:', typeof result);

      if (result) {
        console.log('📊 HomeScreen: Result keys:', Object.keys(result));
        console.log('📊 HomeScreen: Complete result object:', JSON.stringify(result, null, 2));
      } else {
        console.log('❌ HomeScreen: Result is null/undefined');
      }

      // Defensive checks untuk result
      if (!result || typeof result !== 'object') {
        console.log('❌ HomeScreen: Invalid result from checkUserMealPlan');
        throw new Error('Invalid meal plan data received');
      }

      // Log semua properties dari result
      console.log('📊 HomeScreen: Result properties breakdown:', {
        hasMealPlan: result.hasMealPlan,
        mealPlanCount: result.mealPlanCount,
        ongoingPlans: result.ongoingPlans,
        ongoingPlansType: typeof result.ongoingPlans,
        ongoingPlansIsArray: Array.isArray(result.ongoingPlans),
        ongoingPlansLength: result.ongoingPlans?.length,
        upcomingPlans: result.upcomingPlans,
        upcomingPlansType: typeof result.upcomingPlans,
        upcomingPlansIsArray: Array.isArray(result.upcomingPlans),
        upcomingPlansLength: result.upcomingPlans?.length,
        allPlans: result.allPlans,
        allPlansLength: result.allPlans?.length,
      });

      // Safely set state dengan fallback values
      const mealPlanExists = result.hasMealPlan || false;
      setHasMealPlan(mealPlanExists);
      setMealPlanCount(result.mealPlanCount || 0);

      // Extract ongoing plans dengan EXPLICIT checking
      const ongoingPlans = result.ongoingPlans;
      console.log('📊 HomeScreen: Extracted ongoing plans (direct):', ongoingPlans);
      console.log('📊 HomeScreen: Typeof ongoing plans:', typeof ongoingPlans);
      console.log('📊 HomeScreen: Is ongoing plans array?:', Array.isArray(ongoingPlans));
      console.log('📊 HomeScreen: Ongoing plans length:', ongoingPlans?.length);

      // Log each ongoing plan if exists
      if (Array.isArray(ongoingPlans) && ongoingPlans.length > 0) {
        ongoingPlans.forEach((plan, index) => {
          console.log(`📋 HomeScreen: Ongoing plan ${index + 1}:`, {
            id: plan?._id,
            name: plan?.name,
            hasToDoList: !!plan?.todoList,
            todoListLength: plan?.todoList?.length,
          });
        });
      }

      // Calculate today's intake if there are ongoing plans
      if (Array.isArray(ongoingPlans) && ongoingPlans.length > 0) {
        console.log('📊 HomeScreen: Processing ongoing plans:', ongoingPlans.length);

        try {
          console.log('📊 HomeScreen: Calling calculateTodayIntake with:', ongoingPlans);
          const calorieData = calculateTodayIntake(ongoingPlans);
          console.log('📊 HomeScreen: Received calorie data:', calorieData);

          // Defensive checks untuk calorieData
          if (calorieData && typeof calorieData === 'object') {
            console.log('📊 HomeScreen: Setting calorie states with data:', calorieData);
            setIntakeCalories(calorieData.intakeCalories || 0);
            setTargetCalories(calorieData.targetCalories || 0);
            setIntakePercentage(calorieData.intakePercentage || 0);
            setRemainingCalories(calorieData.remainingCalories || 0);
            setCompletedMeals(calorieData.completedMeals || 0);
            setTotalMeals(calorieData.totalMeals || 0);
          } else {
            console.log('❌ HomeScreen: Invalid calorie data received');
            // Don't reset here, wait for meal & exercise plan check
          }
        } catch (error) {
          console.error('❌ HomeScreen: Error calculating today intake:', error);
          // Don't reset here, wait for meal & exercise plan check
        }
      } else {
        console.log(
          '📊 HomeScreen: No ongoing meal plans found, will check meal & exercise plans for calorie data'
        );
        console.log('📊 HomeScreen: ongoingPlans value:', ongoingPlans);
        console.log('📊 HomeScreen: Array.isArray check:', Array.isArray(ongoingPlans));
        console.log('📊 HomeScreen: Length check:', ongoingPlans?.length);
        // Don't reset calorie data here, let meal & exercise plan check handle it
      }
      
      return mealPlanExists; // Return meal plan status
    } catch (error) {
      console.error('❌ HomeScreen: Error checking meal plan status:', error);
      if (error instanceof Error) {
        console.error('❌ HomeScreen: Error stack:', error.stack);
      }

      // Reset all states to safe defaults pada error
      setHasMealPlan(false);
      setMealPlanCount(0);
      resetCalorieData();
      
      return false; // Return meal plan status
    } finally {
      setMealPlanLoading(false);
    }
  };

  // Check exercise plan status
  const checkExercisePlanStatus = async () => {
    try {
      setExercisePlanLoading(true);
      console.log('🏋️ HomeScreen: Checking exercise plan status...');

      const result = await checkUserExercisePlan();
      console.log('🏋️ HomeScreen: Exercise plan result received:', result);

      if (result && typeof result === 'object') {
        setHasExercisePlan(result.hasExercisePlan || false);
        setExercisePlanCount(result.exercisePlanCount || 0);
        console.log('🏋️ HomeScreen: Exercise plan status set:', {
          hasExercisePlan: result.hasExercisePlan,
          exercisePlanCount: result.exercisePlanCount,
        });
      } else {
        console.log('❌ HomeScreen: Invalid exercise plan result');
        setHasExercisePlan(false);
        setExercisePlanCount(0);
      }
    } catch (error) {
      console.error('❌ HomeScreen: Error checking exercise plan status:', error);
      setHasExercisePlan(false);
      setExercisePlanCount(0);
    } finally {
      setExercisePlanLoading(false);
    }
  };

  // Check meal & exercise plan status
  const checkMealExercisePlanStatus = async (mealPlanExists = false) => {
    try {
      setMealExercisePlanLoading(true);
      console.log('🍽️🏋️ HomeScreen: Checking meal & exercise plan status...');

      const result = await checkUserMealExercisePlan();
      console.log('🍽️🏋️ HomeScreen: Meal & exercise plan result received:', result);

      if (result && typeof result === 'object') {
        setHasMealExercisePlan(result.hasMealExercisePlan || false);
        setMealExercisePlanCount(result.mealExercisePlanCount || 0);
        console.log('🍽️🏋️ HomeScreen: Meal & exercise plan status set:', {
          hasMealExercisePlan: result.hasMealExercisePlan,
          mealExercisePlanCount: result.mealExercisePlanCount,
        });

        // Prioritas logika kalori:
        // 1. Jika ada meal plan → gunakan kalori dari meal plan  
        // 2. Jika tidak ada meal plan tapi ada meal & exercise plan → gunakan kalori dari meal & exercise plan
        // 3. Jika tidak ada keduanya → reset kalori data
        
        console.log('🍽️🏋️ HomeScreen: Calorie logic - mealPlanExists:', mealPlanExists);
        console.log('🍽️🏋️ HomeScreen: Calorie logic - hasMealExercisePlan:', result.hasMealExercisePlan);
        console.log('🍽️🏋️ HomeScreen: Calorie logic - ongoing plans length:', result.ongoingPlans?.length);

        if (!mealPlanExists && result.hasMealExercisePlan && Array.isArray(result.ongoingPlans) && result.ongoingPlans.length > 0) {
          console.log('🍽️🏋️ HomeScreen: ✅ Condition met: No meal plan but has meal & exercise plan, calculating calories...');
          try {
            const calorieData = calculateMealExerciseTodayIntake(result.ongoingPlans);
            console.log('🍽️🏋️ HomeScreen: Received calorie data from meal & exercise plan:', calorieData);

            if (calorieData && typeof calorieData === 'object') {
              console.log('🍽️🏋️ HomeScreen: ✅ Setting calorie data from meal & exercise plan:');
              console.log('   - intakeCalories:', calorieData.intakeCalories);
              console.log('   - targetCalories:', calorieData.targetCalories);
              console.log('   - completedMeals:', calorieData.completedMeals);
              console.log('   - totalMeals:', calorieData.totalMeals);
              
              setIntakeCalories(calorieData.intakeCalories || 0);
              setTargetCalories(calorieData.targetCalories || 0);
              setIntakePercentage(calorieData.intakePercentage || 0);
              setRemainingCalories(calorieData.remainingCalories || 0);
              setCompletedMeals(calorieData.completedMeals || 0);
              setTotalMeals(calorieData.totalMeals || 0);
            } else {
              console.log('❌ HomeScreen: Invalid calorie data received from meal & exercise plan');
              resetCalorieData();
            }
          } catch (error) {
            console.error('❌ HomeScreen: Error calculating meal & exercise plan calories:', error);
            resetCalorieData();
          }
        } else if (!mealPlanExists && !result.hasMealExercisePlan) {
          // If no meal plan and no meal & exercise plan, reset calorie data
          console.log('🍽️🏋️ HomeScreen: ❌ No meal plan and no meal & exercise plan, resetting calorie data');
          resetCalorieData();
        } else if (mealPlanExists) {
          console.log('🍽️🏋️ HomeScreen: ℹ️ Meal plan exists, keeping meal plan calorie data');
          // Do nothing, meal plan calories should already be set by checkMealPlanStatus
        } else {
          console.log('🍽️🏋️ HomeScreen: ⚠️ Unhandled condition for calorie logic');
        }
      } else {
        console.log('❌ HomeScreen: Invalid meal & exercise plan result');
        setHasMealExercisePlan(false);
        setMealExercisePlanCount(0);
        if (!mealPlanExists) {
          resetCalorieData();
        }
      }
    } catch (error) {
      console.error('❌ HomeScreen: Error checking meal & exercise plan status:', error);
      setHasMealExercisePlan(false);
      setMealExercisePlanCount(0);
      if (!mealPlanExists) {
        resetCalorieData();
      }
    } finally {
      setMealExercisePlanLoading(false);
    }
  };

  // New function to handle both meal and exercise plan checks
  const handlePlanChecks = async () => {
    // First check meal plan and get its status
    const mealPlanResult = await checkMealPlanStatus();
    // Then check exercise plan
    await checkExercisePlanStatus();
    // Finally check meal & exercise plan (pass meal plan status from result)
    const currentMealPlanStatus = mealPlanResult !== undefined ? mealPlanResult : hasMealPlan;
    await checkMealExercisePlanStatus(currentMealPlanStatus);
  };

  // PENTING: Helper function untuk reset calorie data - HARUS DIATAS checkMealPlanStatus
  const resetCalorieData = () => {
    console.log('🔄 Resetting calorie data to defaults');
    setIntakeCalories(0);
    setTargetCalories(0);
    setIntakePercentage(0);
    setRemainingCalories(0);
    setCompletedMeals(0);
    setTotalMeals(0);
  };

  const validateAndNavigate = async (navigateCallback: () => void) => {
    try {
      console.log('🔍 HomeScreen: Starting profile validation...');
      const validation = await validateProfileForPlanCreation();

      if (validation.isValid) {
        console.log('✅ HomeScreen: Profile is valid, proceeding with navigation');
        navigateCallback();
      } else {
        console.log('❌ HomeScreen: Profile incomplete:', validation.missingFields);
        if (validation.missingFields.includes('profile_error')) {
          showProfileErrorAlert(navigation);
        } else {
          showProfileIncompleteAlert(validation.missingFields, navigation);
        }
      }
    } catch (error) {
      console.error('❌ HomeScreen: Error during validation:', error);
      showProfileErrorAlert(navigation);
    }
  };

  // Handle banner press
  const handleMealPlanBannerPress = () => {
    if (hasMealPlan) {
      // If user has meal plan, navigate to Plans screen
      (navigation as any).navigate('Plans');
    } else {
      // If no meal plan, validate profile first then navigate directly to AddPlan
      validateAndNavigate(() => {
        (navigation as any).navigate('AddPlan');
      });
    }
  };

  // Handle exercise plan banner press
  const handleExercisePlanBannerPress = () => {
    if (hasExercisePlan) {
      // If user has exercise plan, navigate to Exercise Plans screen
      (navigation as any).navigate('ExercisePlans');
    } else {
      // Check if user is premium before allowing access
      handlePremiumFeaturePress('Exercise Plan');
    }
  };

  // Load initial data on mount
  useEffect(() => {
    handlePlanChecks();
    loadProfileData();
  }, []);

  // Refresh when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('🏠 HomeScreen focused, refreshing data...');

      // Wrap dalam timeout untuk menghindari race condition
      const timeoutId = setTimeout(() => {
        handlePlanChecks().catch((error) => {
          console.error('❌ Error in useFocusEffect:', error);
        });
        loadProfileData().catch((error) => {
          console.error('❌ Error loading profile in useFocusEffect:', error);
        });
      }, 100);

      return () => {
        clearTimeout(timeoutId);
      };
    }, [])
  );

  // Auto-refresh every minute to update daily data
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      // Refresh at the start of each day (00:00)
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        console.log('🌅 New day detected, refreshing meal plan data...');
        checkMealPlanStatus();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Improved auto slide functions
  const startAutoSlide = () => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      // Only auto slide if no user interaction
      Animated.timing(fadeAnim, {
        toValue: 0.2,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % bannerImages.length);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }).start();
      });
    }, 4500); // Slightly longer interval
  };

  const stopAutoSlide = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const goToNextSlide = () => {
    stopAutoSlide();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0.2,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % bannerImages.length);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        // Restart auto slide
        setTimeout(() => {
          startAutoSlide();
        }, 3000);
      });
    });
  };

  const goToPrevSlide = () => {
    stopAutoSlide();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0.2,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentBannerIndex((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        // Restart auto slide
        setTimeout(() => {
          startAutoSlide();
        }, 3000);
      });
    });
  };

  // Manual navigation for indicators - Fixed
  const goToSlide = (index: number) => {
    if (index === currentBannerIndex) return;

    // Stop auto slide immediately
    stopAutoSlide();

    // Animate fade out and change index
    Animated.timing(fadeAnim, {
      toValue: 0.2,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setCurrentBannerIndex(index);

      // Animate fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        // Restart auto slide after animation completes
        setTimeout(() => {
          startAutoSlide();
        }, 2000);
      });
    });
  };

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return (
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 15
        );
      },
      onPanResponderGrant: () => {
        stopAutoSlide();
      },
      onPanResponderMove: (evt, gestureState) => {
        // Visual feedback during swipe
        const maxTranslate = screenWidth * 0.2;
        const clampedTranslate = Math.max(-maxTranslate, Math.min(maxTranslate, gestureState.dx));
        translateX.setValue(clampedTranslate);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const swipeThreshold = screenWidth * 0.15;

        if (gestureState.dx > swipeThreshold) {
          // Swipe right - go to previous
          goToPrevSlide();
        } else if (gestureState.dx < -swipeThreshold) {
          // Swipe left - go to next
          goToNextSlide();
        } else {
          // Not enough swipe distance - reset
          Animated.spring(translateX, {
            toValue: 0,
            tension: 200,
            friction: 8,
            useNativeDriver: true,
          }).start();

          // Restart auto slide
          setTimeout(() => {
            startAutoSlide();
          }, 2000);
        }
      },
      onPanResponderTerminate: () => {
        // Reset on termination
        Animated.spring(translateX, {
          toValue: 0,
          tension: 200,
          friction: 8,
          useNativeDriver: true,
        }).start();

        setTimeout(() => {
          startAutoSlide();
        }, 2000);
      },
    })
  ).current;

  // Start auto slide on mount
  useEffect(() => {
    startAutoSlide();

    return () => {
      stopAutoSlide();
    };
  }, []);

  // Log initial state untuk debugging
  useEffect(() => {
    console.log('🏠 HomeScreen mounted with initial states:');
    console.log('- mealPlanLoading:', mealPlanLoading);
    console.log('- hasMealPlan:', hasMealPlan);
    console.log('- mealPlanCount:', mealPlanCount);
    console.log('- exercisePlanLoading:', exercisePlanLoading);
    console.log('- hasExercisePlan:', hasExercisePlan);
    console.log('- exercisePlanCount:', exercisePlanCount);
    console.log('- profileLoading:', profileLoading);
  }, []);

  const bannerImages = [
    {
      uri: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=200&fit=crop',
      title: 'Healthy Living Starts Here',
      subtitle: 'Discover nutritious meals & fitness plans',
    },
    {
      uri: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=200&fit=crop',
      title: 'Fresh & Nutritious',
      subtitle: 'Organic ingredients for better health',
    },
    {
      uri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=200&fit=crop',
      title: 'Meal Planning Made Easy',
      subtitle: 'Customize your perfect diet plan',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.appTitleShadow}>FITEMEAL</Text>
            <Text style={styles.appTitle}>FITEMEAL</Text>
          </View>
          <View style={styles.profileButton}>
            <Image
              source={
                profile?.profilePicture
                  ? { uri: profile.profilePicture }
                  : require('../assets/istockphoto-1130884625-612x612.jpg') // Default image
              }
              style={styles.profileImage}
            />
            <View style={styles.onlineIndicator} />
          </View>
        </View>

        {/* Banner with Swipe Support - DISABLED */}
        <View style={styles.bannerSection}>
          <View style={styles.bannerContainer}>
            <Animated.Image
              source={{ uri: bannerImages[currentBannerIndex].uri }}
              style={[
                styles.bannerImage,
                {
                  opacity: fadeAnim,
                  transform: [{ translateX: translateX }],
                },
              ]}
            />
            {/* Main Banner Gradient - Minimalized */}
            <LinearGradient
              colors={['transparent', 'rgba(34, 197, 94, 0.1)', 'rgba(34, 197, 94, 0.5)']}
              style={styles.bannerGradient}
            />
            <Animated.View
              style={[styles.bannerOverlay, { transform: [{ translateX: translateX }] }]}>
              <Text style={styles.bannerTitle}>{bannerImages[currentBannerIndex].title}</Text>
              <Text style={styles.bannerSubtitle}>{bannerImages[currentBannerIndex].subtitle}</Text>
            </Animated.View>
          </View>
          <View style={styles.bannerIndicators}>
            {bannerImages.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.indicator, currentBannerIndex === index && styles.activeIndicator]}
                onPress={() => goToSlide(index)}
              />
            ))}
          </View>
        </View>

        {/* Updated Quick Stats - Dynamic Calories dengan error handling */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Progress Today</Text>
          <View style={styles.statsGrid}>
            {/* Intake Calories Card - Dynamic */}
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statIcon}>📊</Text>
                <Text style={styles.statLabel}>Intake Calories</Text>
              </View>
              <Text style={styles.statNumber}>
                {mealPlanLoading ? '...' : (intakeCalories || 0).toLocaleString()}
              </Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(intakePercentage || 0, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {mealPlanLoading ? 'Loading...' : `${intakePercentage || 0}% of target`}
                </Text>
                {!mealPlanLoading && (
                  <Text style={styles.mealsText}>
                    {completedMeals || 0}/{totalMeals || 0} meals completed
                  </Text>
                )}
              </View>
            </View>

            {/* Target Calories Card - Dynamic */}
            <View style={[styles.statCard, styles.targetCard]}>
              <View style={styles.statHeader}>
                <Text style={styles.targetIcon}>🎯</Text>
                <Text style={styles.statLabel}>Target Calories</Text>
              </View>
              <Text style={styles.targetNumber}>
                {mealPlanLoading ? '...' : (targetCalories || 0).toLocaleString()}
              </Text>
              <View style={styles.targetInfo}>
                <View style={styles.targetBadge}>
                  <Text style={styles.targetBadgeText}>Daily Goal</Text>
                </View>
                <Text style={styles.remainingText}>
                  {mealPlanLoading ? 'Loading...' : `${remainingCalories || 0} remaining`}
                </Text>
                {!mealPlanLoading && (targetCalories || 0) === 0 && (
                  <Text style={styles.noDataText}>No active meal plan</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Action Cards - keep existing with dynamic meal plan status */}
        <View style={styles.actionSection}>
          <View style={styles.actionRow}>
            {/* Dynamic Meal Plan Card */}
            <TouchableOpacity style={styles.actionCard} onPress={handleMealPlanBannerPress}>
              <Image
                source={{
                  uri: hasMealPlan
                    ? 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=200&h=120&fit=crop'
                    : 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=200&h=120&fit=crop',
                }}
                style={styles.actionImage}
              />
              <LinearGradient
                colors={
                  hasMealPlan
                    ? ['transparent', 'rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.7)']
                    : ['transparent', 'rgba(139, 74, 107, 0.2)', 'rgba(139, 74, 107, 0.7)']
                }
                style={styles.actionGradient}
              />
              <View style={styles.actionOverlay}>
                <Text style={styles.actionTitle}>
                  {hasMealPlan ? 'YOUR MEAL PLAN' : 'GET A MEAL PLAN'}
                </Text>
                <Text style={styles.actionSubtitle}>
                  {hasMealPlan
                    ? `${mealPlanCount} active plan${mealPlanCount > 1 ? 's' : ''}`
                    : 'Personalized nutrition'}
                </Text>
                {hasMealPlan && (
                  <View style={styles.activePlanIndicator}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeText}>Active</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Dynamic Exercise Plan Card */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleExercisePlanBannerPress}
              activeOpacity={0.8}>
              <Image
                source={{
                  uri: hasExercisePlan
                    ? 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=120&fit=crop'
                    : 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=120&fit=crop',
                }}
                style={styles.actionImage}
              />
              <LinearGradient
                colors={
                  hasExercisePlan
                    ? ['transparent', 'rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.7)']
                    : ['transparent', 'rgba(255, 159, 64, 0.2)', 'rgba(255, 159, 64, 0.7)']
                }
                style={styles.actionGradient}
              />
              <View style={styles.actionOverlay}>
                <Text style={styles.actionTitle}>
                  {hasExercisePlan ? 'YOUR EXERCISE PLAN' : 'GET EXERCISE PLAN'}
                </Text>
                <Text style={styles.actionSubtitle}>
                  {hasExercisePlan
                    ? `${exercisePlanCount} active plan${exercisePlanCount > 1 ? 's' : ''}`
                    : 'Fitness & wellness'}
                </Text>
                {hasExercisePlan && (
                  <View style={styles.activePlanIndicator}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeText}>Active</Text>
                  </View>
                )}
                {!hasExercisePlan && !user?.isPremium && (
                  <View style={styles.premiumBadge}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upload Image Section - keep existing */}
        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Meal Planning</Text>
          <TouchableOpacity 
            style={styles.uploadBannerCard}
            onPress={() => handlePremiumFeaturePress('Upload Photo')}
          >
            <Image
              source={{
                uri: 'https://media.istockphoto.com/id/1241881284/photo/hands-of-cook-photographing-mexican-tacos.jpg?s=612x612&w=0&k=20&c=zFkJ71PlN32cgEpEiuKxVwb5f89fZoI9xt4xfyRhQUM=',
              }}
              style={styles.uploadBannerImage}
            />
            {/* Upload Banner Gradient - Minimalized */}
            <LinearGradient
              colors={['transparent', 'transparent', 'rgba(34, 197, 94, 0.6)']}
              style={styles.uploadBannerGradient}
            />
            <View style={styles.uploadBannerOverlay}>
              <View style={styles.uploadContentWrapper}>
                <Text style={styles.uploadBannerTitle}>
                  Upload Image to Generate Your Meal Plan
                </Text>
                <Text style={styles.uploadBannerSubtitle}>
                  Take a photo of your ingredients or favorite dish
                </Text>
                <View style={styles.uploadBadge}>
                  <Text style={styles.uploadBadgeText}>Upload Photo</Text>
                </View>
              </View>
              {!user?.isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// Merge dengan existing styles
const styles = StyleSheet.create({
  activePlanIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  premiumBadge: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  activeText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FBF6', // Very light green background
  },
  scrollContent: {
    flex: 1,
    marginBottom: 0, // Remove excessive margin that causes white space
  },

  // Header Styles - Green theme
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E8', // Light green border
  },
  titleContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  appTitleShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    fontSize: 36,
    fontWeight: '900',
    color: 'rgba(34, 197, 94, 0.15)', // Green shadow
    letterSpacing: 5,
    textTransform: 'uppercase',
  },
  appTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#22C55E', // Fresh green
    letterSpacing: 5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    elevation: 4,
    shadowColor: '#22C55E', // Green shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#F0FDF4', // Very light green border
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981', // Keep green for status
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Banner Styles - Green gradients
  bannerSection: {
    paddingHorizontal: 20,
    marginBottom: 18,
    marginTop: 8,
  },
  bannerContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 10,
    position: 'relative',
    height: 200,
    elevation: 6,
    shadowColor: '#22C55E', // Green shadow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%', // Reduced from 70% to 50%
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 24,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.95,
    lineHeight: 18,
    fontWeight: '400',
  },
  bannerIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#BBF7D0', // Light green
  },
  activeIndicator: {
    backgroundColor: '#F59E0B', // Orange accent
    width: 28,
    height: 8,
    borderRadius: 4,
  },

  // Stats Section - Green theme with orange accents
  statsSection: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#15803D', // Dark green
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#22C55E', // Green shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E8F5E8', // Light green border
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  targetIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#22C55E', // Fresh green for intake
    marginBottom: 8,
    textAlign: 'center',
  },
  targetNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F59E0B', // Orange for target
    marginBottom: 8,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280', // Grey text
    fontWeight: '500',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E8F5E8', // Light green background
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22C55E', // Green progress
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: '#6B7280', // Grey text
    fontWeight: '500',
  },
  targetCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B', // Orange accent border
  },
  targetInfo: {
    alignItems: 'center',
  },
  targetBadge: {
    backgroundColor: '#FEF3C7', // Light orange background
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 4,
  },
  targetBadgeText: {
    fontSize: 10,
    color: '#D97706', // Dark orange text
    fontWeight: '600',
  },
  remainingText: {
    fontSize: 10,
    color: '#F59E0B', // Orange text
    fontWeight: '500',
  },

  // Action Section - Green gradients
  actionSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    height: 130,
    elevation: 4,
    shadowColor: '#22C55E', // Green shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  actionImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  actionGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%', // Reduced from 60% to 45%
  },
  actionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 14,
    paddingBottom: 18,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 3,
    lineHeight: 15,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  actionSubtitle: {
    fontSize: 10,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.95,
    lineHeight: 13,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },

  // Upload Section - Green theme
  uploadSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  uploadBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    position: 'relative',
    height: 180,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  uploadBannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadBannerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%', // Reduced from 60% to 40%
  },
  uploadBannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 24,
  },
  uploadContentWrapper: {
    alignItems: 'center',
  },
  uploadBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  uploadBannerSubtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  uploadBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadBadgeText: {
    fontSize: 13,
    color: '#22C55E',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Bottom Navigation - Green theme
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingBottom: 26,
    elevation: 10,
    shadowColor: '#22C55E', // Green shadow
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderTopWidth: 1,
    borderTopColor: '#E8F5E8', // Light green border
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  navIconText: {
    fontSize: 17,
  },
  navLabel: {
    fontSize: 11,
    color: '#6B7280', // Grey text
  },
  activeNavLabel: {
    color: '#22C55E', // Fresh green for active
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F59E0B', // Orange button
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#F59E0B', // Orange shadow
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  addButtonText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // Featured Section - Green theme
  featuredSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  featuredGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  featuredCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#22C55E', // Green shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8F5E8', // Light green border
  },
  featuredImage: {
    width: '100%',
    height: 90,
    resizeMode: 'cover',
  },
  featuredInfo: {
    padding: 10,
  },
  featuredTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#15803D', // Dark green
    marginBottom: 3,
  },
  featuredDescription: {
    fontSize: 11,
    color: '#6B7280', // Grey
  },

  // Quick Options - Green theme
  quickOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  quickOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#22C55E', // Green shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8F5E8', // Light green border
  },
  quickOptionIcon: {
    fontSize: 22,
    color: '#F59E0B', // Orange icons
    marginBottom: 6,
  },
  quickOptionText: {
    fontSize: 13,
    color: '#15803D', // Dark green text
    textAlign: 'center',
  },
  mealsText: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  noDataText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 2,
  },
});
