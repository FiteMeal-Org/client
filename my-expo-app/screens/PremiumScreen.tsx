import * as React from 'react';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://api-fitemeal.vercel.app';

export default function PremiumScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');

  const generateOrderId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `fitemeal-premium-${timestamp}-${random}`;
  };

  const handleGoPremium = async () => {
    try {
      setLoading(true);
      
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      const orderId = generateOrderId();
      const amount = 1000000; // 1,000,000 IDR for premium

      const response = await fetch(`${BASE_URL}/api/midtrans-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          orderId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Payment token response:', result);
      
      if (result.paymentMethodLink || result.paymentUrl || result.redirect_url) {
        setPaymentUrl(result.paymentMethodLink || result.paymentUrl || result.redirect_url);
        setShowPayment(true);
      } else {
        throw new Error('Payment URL not received');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      Alert.alert('Error', 'Failed to create payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    console.log('Navigation URL:', navState.url);
    
    // Check if payment is successful
    if (navState.url.includes('status_code=200')) {
      Alert.alert(
        'Payment Successful!',
        'Welcome to FiteMeal Premium! You now have access to all premium features.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowPayment(false);
              navigation.navigate('BerandaNavigator' as never);
            },
          },
        ]
      );
    }
    
    // Check if payment failed or cancelled
    if (navState.url.includes('status_code=201') || navState.url.includes('status_code=202')) {
      Alert.alert(
        'Payment Failed',
        'Your payment was not successful. Please try again.',
        [
          {
            text: 'Try Again',
            onPress: () => setShowPayment(false),
          },
        ]
      );
    }
  };

  if (showPayment) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <View style={styles.webViewHeader}>
          <TouchableOpacity 
            onPress={() => setShowPayment(false)} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#8B0000" />
          </TouchableOpacity>
          <Text style={styles.webViewTitle}>Complete Payment</Text>
          <View style={styles.placeholder} />
        </View>
        <WebView
          source={{ uri: paymentUrl }}
          style={styles.webView}
          onNavigationStateChange={handleNavigationStateChange}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color="#8B0000" />
              <Text style={styles.loadingText}>Loading payment...</Text>
            </View>
          )}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#8B0000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FiteMeal Premium</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Premium Banner */}
        <View style={styles.bannerContainer}>
          <View style={styles.premiumIcon}>
            <Ionicons name="star" size={48} color="#FFD700" />
          </View>
          <Text style={styles.bannerTitle}>Upgrade to Premium</Text>
          <Text style={styles.bannerSubtitle}>
            Unlock all features and get the most out of your fitness journey
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Premium Features</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="fitness" size={24} color="#10B981" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Custom Exercise Plans</Text>
              <Text style={styles.featureDescription}>
                Access personalized workout routines tailored to your goals
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="camera" size={24} color="#10B981" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Photo Upload</Text>
              <Text style={styles.featureDescription}>
                Track your progress with unlimited photo uploads
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="restaurant" size={24} color="#10B981" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Advanced Meal Plans</Text>
              <Text style={styles.featureDescription}>
                Get detailed nutrition plans with premium recipes
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="analytics" size={24} color="#10B981" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Detailed Analytics</Text>
              <Text style={styles.featureDescription}>
                Monitor your progress with advanced tracking tools
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="headset" size={24} color="#10B981" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Priority Support</Text>
              <Text style={styles.featureDescription}>
                Get instant help from our dedicated support team
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.pricingContainer}>
          <Text style={styles.pricingTitle}>Premium Plan</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>Rp 1,000,000</Text>
            <Text style={styles.pricePeriod}>/ month</Text>
          </View>
          <Text style={styles.pricingNote}>
            Cancel anytime • No hidden fees • Instant access
          </Text>
        </View>
      </ScrollView>

      {/* Go Premium Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.premiumButton, loading && styles.premiumButtonDisabled]}
          onPress={handleGoPremium}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.premiumButtonText}>Processing...</Text>
            </View>
          ) : (
            <>
              <Ionicons name="star" size={20} color="#FFFFFF" />
              <Text style={styles.premiumButtonText}>Go Premium</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  bannerContainer: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  premiumIcon: {
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  bannerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureContent: {
    flex: 1,
    marginLeft: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  pricingContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  pricePeriod: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  pricingNote: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  premiumButton: {
    backgroundColor: '#8B0000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  premiumButtonDisabled: {
    opacity: 0.7,
  },
  premiumButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});
