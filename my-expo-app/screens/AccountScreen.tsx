import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { getUserProfile, UserProfile } from '../services/profileService';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { AuthContext } from '../App';

export default function AccountScreen() {
  const navigation = useNavigation();
  const { setToken } = React.useContext(AuthContext);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await getUserProfile();
      setProfile(userProfile);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function untuk redirect ke ProfileFormScreen
  const handleEditProfile = () => {
    (navigation as any).navigate('ProfileForm', { editMode: true }); // Redirect ke ProfileFormScreen dengan editMode
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            // Clear tokens
            await SecureStore.deleteItemAsync('access_token');
            await SecureStore.deleteItemAsync('user_id');

            // Update context to trigger re-render
            setToken(null);
          } catch (error) {
            console.error('Error during logout:', error);
            Alert.alert('Error', 'Failed to logout properly');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#8B4A6B" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header dengan tombol settings yang redirect ke edit profile */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
          <TouchableOpacity onPress={handleEditProfile} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#8B4A6B" />
          </TouchableOpacity>
        </View>

        {/* Profile Section - Hapus camera button */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={
                profile?.profilePicture
                  ? { uri: profile.profilePicture }
                  : require('../assets/istockphoto-1130884625-612x612.jpg') // Gunakan asset image
              }
              style={styles.profileImage}
            />
            {/* Camera button dihapus */}
          </View>

          <Text style={styles.userName}>
            {profile?.firstName || profile?.lastName
              ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
              : profile?.username || 'User'}
          </Text>
          <Text style={styles.userEmail}>{profile?.email}</Text>
        </View>

        {/* Profile Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.detailCard}>
            <ProfileDetailItem
              icon="person-outline"
              label="Username"
              value={profile?.username || 'Not set'}
            />
            <ProfileDetailItem
              icon="mail-outline"
              label="Email"
              value={profile?.email || 'Not set'}
            />
            <ProfileDetailItem
              icon="calendar-outline"
              label="Age"
              value={profile?.age ? `${profile.age} years` : 'Not set'}
            />
            <ProfileDetailItem
              icon="fitness-outline"
              label="Weight"
              value={profile?.weight ? `${profile.weight} kg` : 'Not set'}
            />
            <ProfileDetailItem
              icon="resize-outline"
              label="Height"
              value={profile?.height ? `${profile.height} cm` : 'Not set'}
            />
            <ProfileDetailItem
              icon="male-female-outline"
              label="Gender"
              value={
                profile?.gender
                  ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)
                  : 'Not set'
              }
            />
            <ProfileDetailItem
              icon="walk-outline"
              label="Activity Level"
              value={
                profile?.activityLevel
                  ? profile.activityLevel.replace('_', ' ').toUpperCase()
                  : 'Not set'
              }
              isLast={true}
            />
          </View>
        </View>

        {/* Action Buttons - Hapus edit profile button, hanya logout */}
        <View style={styles.actionSection}>
          {/* Tombol Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// Component untuk detail item
const ProfileDetailItem = ({
  icon,
  label,
  value,
  isLast = false,
}: {
  icon: string;
  label: string;
  value: string;
  isLast?: boolean;
}) => (
  <View style={[styles.detailItem, !isLast && styles.detailItemBorder]}>
    <View style={styles.detailLeft}>
      <Ionicons name={icon as any} size={20} color="#6B7280" />
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FBF6',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  profileImageContainer: {
    marginBottom: 16,
    // Hapus position: 'relative' karena tidak ada camera button
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E7EB',
  },
  // Camera button styles dihapus
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
  },
  detailsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
  },
  detailValue: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingBottom: 30, // Reduced padding since no more edit button
  },
  // Edit profile button styles dihapus
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
