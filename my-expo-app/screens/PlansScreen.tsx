import React, { useState, useEffect, use } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export default function PlansScreen() {
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            setError('');

            // Get user ID from SecureStore
            const userId = await SecureStore.getItemAsync('user_id');
            console.log(userId, 'User ID from SecureStore');

            const token = await SecureStore.getItemAsync('access_token');

            console.log('🔍 User ID from SecureStore:', userId);
            console.log('🔍 Token from SecureStore:', token ? 'Token exists' : 'No token');

            if (!userId) {
                setError('User ID not found in SecureStore');
                return;
            }

            if (!token) {
                setError('Access token not found in SecureStore');
                return;
            }

            // Make API request
            const response = await axios.get(
                `https://fh8mlxkf-3000.asse.devtunnels.ms/api/add-prepmeal/${userId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ API Response Status:', response.status);
            console.log('✅ API Response Data:', response.data);

            setUserData(response.data);

        } catch (error: any) {
            console.log('❌ API Error:', error.response?.data || error.message);
            setError(error.response?.data?.message || error.message || 'Failed to fetch user data');
        } finally {
            setLoading(false);
        }
    };

    const retryFetch = () => {
        fetchUserData();
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Plans</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8B4A6B" />
                    <Text style={styles.loadingText}>Loading user data...</Text>
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Plans</Text>
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>Error</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={retryFetch}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Plans</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={retryFetch}>
                    <Text style={styles.refreshButtonText}>🔄</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* JSON Response Display */}
                <View style={styles.jsonContainer}>
                    <Text style={styles.jsonTitle}>API Response (JSON):</Text>
                    <ScrollView style={styles.jsonScrollView} nestedScrollEnabled={true}>
                        <Text style={styles.jsonText}>
                            {JSON.stringify(userData, null, 2)}
                        </Text>
                    </ScrollView>
                </View>

                {/* User Info Summary */}
                {userData && (
                    <View style={styles.summaryContainer}>
                        <Text style={styles.summaryTitle}>User Summary:</Text>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>User ID:</Text>
                            <Text style={styles.summaryValue}>{userData.id || 'N/A'}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Full Name:</Text>
                            <Text style={styles.summaryValue}>{userData.fullName || 'N/A'}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Email:</Text>
                            <Text style={styles.summaryValue}>{userData.email || 'N/A'}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Height:</Text>
                            <Text style={styles.summaryValue}>{userData.height || 'N/A'} cm</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Weight:</Text>
                            <Text style={styles.summaryValue}>{userData.weight || 'N/A'} kg</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Activity Level:</Text>
                            <Text style={styles.summaryValue}>{userData.activityLevel || 'N/A'}</Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: 'white',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    refreshButton: {
        padding: 8,
        backgroundColor: '#8B4A6B',
        borderRadius: 8,
    },
    refreshButtonText: {
        fontSize: 16,
        color: 'white',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#8B4A6B',
        textAlign: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF4444',
        marginBottom: 8,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    retryButton: {
        backgroundColor: '#8B4A6B',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    jsonContainer: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        marginTop: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    jsonTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    jsonScrollView: {
        maxHeight: 300,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        padding: 12,
    },
    jsonText: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#333',
        lineHeight: 16,
    },
    summaryContainer: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: 'bold',
        maxWidth: '60%',
        textAlign: 'right',
    },
});