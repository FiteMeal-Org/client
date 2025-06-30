import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: 'male' | 'female';
  activityLevel?: 'inactive' | 'somewhat_active' | 'active' | 'very_active';
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const token = await SecureStore.getItemAsync('access_token');
    const userId = await SecureStore.getItemAsync('user_id');

    if (!token || !userId) {
      throw new Error('No authentication token or user ID found');
    }

    console.log('🔍 Fetching profile for user:', userId);

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/profiles/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📄 Profile data received:', result);

    return result.data || result.user || result;
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (
  profileData: Partial<UserProfile>
): Promise<UserProfile> => {
  try {
    const token = await SecureStore.getItemAsync('access_token');
    const userId = await SecureStore.getItemAsync('user_id');

    if (!token || !userId) {
      throw new Error('No authentication token or user ID found');
    }

    console.log('💾 Updating profile for user:', userId);
    console.log('📊 Profile data to update:', profileData);

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/profiles/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Profile updated successfully:', result);

    return result.data || result.user || result;
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    throw error;
  }
};
