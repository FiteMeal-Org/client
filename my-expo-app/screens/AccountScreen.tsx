import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

type ProfileScreenProps = {
    onNavigate: (screen: string) => void;
};

interface UserProfile {
    id: string;
    fullName: string;
    username: string;
    email: string;
    dateOfBirth: string;
    gender: string;
    height?: number;
    weight?: number;
    activityLevel?: string;
    age?: number;
}

export default function ProfileScreen({ onNavigate }: ProfileScreenProps) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const userId = await SecureStore.getItemAsync('user_id'); // Changed from 'userId' to 'user_id'
            const token = await SecureStore.getItemAsync('access_token');

            console.log('🔍 Debug AccountScreen - userId:', userId);
            console.log('🔍 Debug AccountScreen - token:', token ? 'Token exists' : 'No token');

            if (!userId) {
                console.log('❌ No userId found');
                Alert.alert('Error', 'User ID not found. Please login again.');
                return;
            }

            if (!token) {
                console.log('❌ No token found');
                Alert.alert('Error', 'Access token not found. Please login again.');
                return;
            }

            console.log('🌐 Making API request to:', `${API_CONFIG.BASE_URL}/api/profiles/${userId}`);

            const response = await axios.get(
                `${API_CONFIG.BASE_URL}/api/profiles/${userId}`, // Changed URL to match LoginScreen
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log('✅ Profile API Response:', response.data);

            // Handle response data structure
            const profileData = response.data.data || response.data;
            console.log('📋 Profile Data:', profileData);
            setProfile(profileData);
        } catch (error: any) {
            console.error('❌ Error fetching profile:', error);
            console.error('❌ Error response:', error.response?.data);
            console.error('❌ Error status:', error.response?.status);
            Alert.alert(
                'Error',
                `Failed to load profile data: ${error.response?.data?.message || error.message}`
            );
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getActivityLevelDisplay = (level?: string) => {
        if (!level) return 'Not set';
        return level.charAt(0).toUpperCase() + level.slice(1).replace(/([A-Z])/g, ' $1');
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#1565C0" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={[styles.container, styles.errorContainer]}>
                <Text style={styles.errorText}>Failed to load profile</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }
    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Scrollable Content */}
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('Home')}>
                        <View style={styles.backButtonContainer}>
                            <Text style={styles.backIcon}>‹</Text>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => onNavigate('ProfileFormScreen')}>
                        <View style={styles.editButtonContainer}>
                            <Text style={styles.editIcon}>⚙️</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Profile Info */}
                <View style={styles.profileSection}>
                    <View style={styles.profileImageContainer}>
                        <Image
                            source={{
                                uri: 'https://images.mubicdn.net/images/cast_member/2184/cache-2992-1547409411/image-w856.jpg',
                            }}
                            style={styles.profileImage}
                        />
                    </View>
                    <Text style={styles.profileName}>{profile.fullName}</Text>
                    <View style={styles.membershipBadge}>
                        <Text style={styles.membershipIcon}>🎯</Text>
                        <Text style={styles.membershipText}>Membership</Text>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Weight</Text>
                            <Text style={styles.statValue}>
                                {profile.weight ? `${profile.weight} kg` : 'Not set'}
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Height</Text>
                            <Text style={styles.statValue}>
                                {profile.height ? `${profile.height} cm` : 'Not set'}
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Activity Level</Text>
                            <Text style={styles.statValue}>{getActivityLevelDisplay(profile.activityLevel)}</Text>
                        </View>
                    </View>
                </View>

                {/* User Information Table - Full Width */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>User Information</Text>

                    <View style={styles.fullWidthTable}>
                        <View style={styles.fullTableRow}>
                            <Text style={styles.fullTableLabel}>Full Name</Text>
                            <Text style={styles.fullTableValue}>{profile.fullName}</Text>
                        </View>

                        <View style={styles.fullTableRow}>
                            <Text style={styles.fullTableLabel}>Username</Text>
                            <Text style={styles.fullTableValue}>@{profile.username}</Text>
                        </View>

                        <View style={styles.fullTableRow}>
                            <Text style={styles.fullTableLabel}>Email</Text>
                            <Text style={styles.fullTableValue}>{profile.email}</Text>
                        </View>

                        <View style={styles.fullTableRow}>
                            <Text style={styles.fullTableLabel}>Age</Text>
                            <Text style={styles.fullTableValue}>{profile.age}</Text>
                        </View>

                        <View style={styles.fullTableRow}>
                            <Text style={styles.fullTableLabel}>Gender</Text>
                            <Text style={styles.fullTableValue}>{profile.gender}</Text>
                        </View>

                        <View style={styles.fullTableRow}>
                            <Text style={styles.fullTableLabel}>Height</Text>
                            <Text style={styles.fullTableValue}>
                                {profile.height ? `${profile.height} cm` : 'Not set'}
                            </Text>
                        </View>

                        <View style={styles.fullTableRow}>
                            <Text style={styles.fullTableLabel}>Weight</Text>
                            <Text style={styles.fullTableValue}>
                                {profile.weight ? `${profile.weight} kg` : 'Not set'}
                            </Text>
                        </View>

                        <View style={[styles.fullTableRow, styles.lastFullTableRow]}>
                            <Text style={styles.fullTableLabel}>Activity Level</Text>
                            <Text style={styles.fullTableValue}>
                                {getActivityLevelDisplay(profile.activityLevel)}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F2F5',
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
    errorContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#1565C0',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    scrollContent: {
        flex: 1,
        marginBottom: 90,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: '#F0F2F5',
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 28,
        color: '#1F2937',
        fontWeight: 'bold',
        marginLeft: -2,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    editButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButtonContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIcon: {
        fontSize: 20,
        color: '#1F2937',
    },
    profileSection: {
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    profileImageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: 'hidden',
        marginBottom: 15,
        borderWidth: 4,
        borderColor: '#FFFFFF',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    membershipBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F4FD',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 25,
    },
    membershipIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    membershipText: {
        fontSize: 14,
        color: '#1565C0',
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        width: '100%',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 6,
        fontWeight: '500',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    infoSection: {
        paddingHorizontal: 0, // Remove horizontal padding
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 15,
        marginLeft: 20, // Add left margin for title only
    },
    fullWidthTable: {
        backgroundColor: 'white',
        paddingHorizontal: 0,
    },
    fullTableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    lastFullTableRow: {
        borderBottomWidth: 0,
    },
    fullTableLabel: {
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '500',
        flex: 1,
    },
    fullTableValue: {
        fontSize: 15,
        color: '#1F2937',
        fontWeight: '600',
        textAlign: 'right',
        flex: 1,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingBottom: 30,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
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
        fontSize: 16,
    },
    navLabel: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500',
    },
    activeNavLabel: {
        color: '#1565C0',
        fontWeight: '600',
    },
    addButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#1F2937',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    addButtonDots: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: 24,
        height: 24,
        justifyContent: 'space-between',
        alignContent: 'space-between',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'white',
    },
});
