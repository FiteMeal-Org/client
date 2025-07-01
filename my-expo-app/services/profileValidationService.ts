import { Alert } from 'react-native';
import { getUserProfile, UserProfile } from './profileService';

export interface ProfileValidationResult {
  isValid: boolean;
  missingFields: string[];
  profile: UserProfile | null;
}

export const validateProfileForPlanCreation = async (): Promise<ProfileValidationResult> => {
  try {
    console.log('🔍 ProfileValidation: Starting profile validation...');

    const profile = await getUserProfile();
    console.log('📋 ProfileValidation: Profile data received:', profile);

    if (!profile) {
      console.log('❌ ProfileValidation: No profile found');
      return {
        isValid: false,
        missingFields: ['profile'],
        profile: null,
      };
    }

    const requiredFields = [
      { field: 'age', value: profile.age, displayName: 'Age' },
      { field: 'weight', value: profile.weight, displayName: 'Weight' },
      { field: 'height', value: profile.height, displayName: 'Height' },
      { field: 'gender', value: profile.gender, displayName: 'Gender' },
      { field: 'activityLevel', value: profile.activityLevel, displayName: 'Activity Level' },
    ];

    const missingFields: string[] = [];

    requiredFields.forEach(({ field, value, displayName }) => {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missingFields.push(displayName);
        console.log(`❌ ProfileValidation: Missing field ${field} (${displayName})`);
      }
    });

    const isValid = missingFields.length === 0;

    console.log('📊 ProfileValidation: Validation result:', {
      isValid,
      missingFields,
      profileExists: !!profile,
    });

    return {
      isValid,
      missingFields,
      profile,
    };
  } catch (error) {
    console.error('❌ ProfileValidation: Error during validation:', error);
    return {
      isValid: false,
      missingFields: ['profile_error'],
      profile: null,
    };
  }
};

export const showProfileIncompleteAlert = (missingFields: string[], navigation: any) => {
  const fieldsText = missingFields.join(', ');

  Alert.alert(
    'Complete Your Profile',
    `Please complete your profile before creating a plan. Missing fields: ${fieldsText}`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Complete Profile',
        onPress: () => {
          // Navigate to ProfileForm screen
          navigation.navigate('ProfileForm');
        },
      },
    ]
  );
};

export const showProfileErrorAlert = (navigation: any) => {
  Alert.alert(
    'Profile Error',
    'Unable to load your profile. Please check your connection and try again.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Go to Profile',
        onPress: () => {
          navigation.navigate('ProfileForm');
        },
      },
    ]
  );
};
