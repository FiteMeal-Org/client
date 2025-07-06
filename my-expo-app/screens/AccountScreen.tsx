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
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Modern Header with Dark Gradient */}
        <LinearGradient
          colors={['#F8FAFC', '#E2E8F0', '#CBD5E1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}>
          <SafeAreaView>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>My Profile</Text>
            </View>

            {/* Profile Section with Modern Card */}
            <View style={styles.profileSection}>
              <View style={styles.profileCard}>
                <View style={styles.profileImageContainer}>
                  <Image
                    source={
                      profile?.profilePicture
                        ? { uri: profile.profilePicture }
                        : require('../assets/istockphoto-1130884625-612x612.jpg')
                    }
                    style={styles.profileImage}
                  />
                  <View style={styles.onlineIndicator} />
                </View>

                <View style={styles.profileInfo}>
                  <Text style={styles.userName}>
                    {profile?.firstName || profile?.lastName
                      ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
                      : profile?.username || 'User'}
                  </Text>
                  <Text style={styles.userEmail}>{profile?.email}</Text>

                  {/* Quick Stats */}
                  <View style={styles.quickStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{profile?.weight || '--'}</Text>
                      <Text style={styles.statLabel}>Weight (kg)</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{profile?.height || '--'}</Text>
                      <Text style={styles.statLabel}>Height (cm)</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{profile?.age || '--'}</Text>
                      <Text style={styles.statLabel}>Age</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Personal Information Table */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          {/* Table Format - Full Width */}
          <View style={styles.infoTable}>
          

            {/* Table Rows */}
            <TableRow
              icon="person"
              label="Username"
              value={profile?.username || 'Not set'}
              isFirst={true}
            />
            <TableRow icon="mail" label="Email" value={profile?.email || 'Not set'} />
            <TableRow
              icon="calendar"
              label="Age"
              value={profile?.age ? `${profile.age} years` : 'Not set'}
            />
            <TableRow
              icon="fitness"
              label="Weight"
              value={profile?.weight ? `${profile.weight} kg` : 'Not set'}
            />
            <TableRow
              icon="resize"
              label="Height"
              value={profile?.height ? `${profile.height} cm` : 'Not set'}
            />
            <TableRow
              icon="male-female"
              label="Gender"
              value={
                profile?.gender
                  ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)
                  : 'Not set'
              }
            />
            <TableRow
              icon="walk"
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

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {/* Edit Profile Button */}
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <View style={styles.editButtonGradient}>
              <Ionicons name="create" size={20} color="#FFFFFF" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </View>
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Component untuk table row
const TableRow = ({
  icon,
  label,
  value,
  isFirst = false,
  isLast = false,
}: {
  icon: string;
  label: string;
  value: string;
  isFirst?: boolean;
  isLast?: boolean;
}) => (
  <View style={[styles.tableRow, isFirst && styles.tableRowFirst, isLast && styles.tableRowLast]}>
    <View style={styles.tableCell}>
      <View style={styles.tableCellContent}>
        <Ionicons name={icon as any} size={18} color="#374151" />
        <Text style={styles.tableLabel}>{label}</Text>
      </View>
    </View>
    <View style={styles.tableCell}>
      <Text style={styles.tableValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
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

  // Modern Gradient Header
  gradientHeader: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 0.5,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Modern Profile Section
  profileSection: {
    paddingHorizontal: 20,
    marginTop: -10,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  profileImageContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },

  // Table Section
  detailsSection: {
    paddingHorizontal: 20,
    paddingTop: 30,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },

  // Modern Table Design
  infoTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  tableRowFirst: {
    // No additional styles needed
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCell: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  tableCellContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableLabel: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
    marginLeft: 10,
  },
  tableValue: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'right',
  },

  // Action Section
  actionSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  editButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  editButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    backgroundColor: '#6366F1',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    borderWidth: 2,
    borderColor: '#FEE2E2',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
