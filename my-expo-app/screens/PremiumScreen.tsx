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
import { LinearGradient } from 'expo-linear-gradient';
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
      Alert.alert('Payment Failed', 'Your payment was not successful. Please try again.', [
        {
          text: 'Try Again',
          onPress: () => setShowPayment(false),
        },
      ]);
    }
  };

  if (showPayment) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <View style={styles.webViewHeader}>
          <TouchableOpacity onPress={() => setShowPayment(false)} style={styles.backButton}>
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
    <LinearGradient colors={['#0F0C29', '#24243e', '#302B63']} style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" translucent />

      {/* Header */}
      <SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FiteMeal Premium</Text>
          <View style={styles.placeholder} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Premium Banner */}
        <View style={styles.bannerContainer}>
          <LinearGradient colors={['#FFD700', '#FFA500', '#FF8C00']} style={styles.premiumIcon}>
            <Ionicons name="star" size={48} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.bannerTitle}>Unlock Premium Excellence</Text>
          <Text style={styles.bannerSubtitle}>
            Experience the ultimate fitness transformation with our premium suite
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Exclusive Premium Benefits</Text>

          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="fitness" size={28} color="#FFD700" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Elite Exercise Programs</Text>
              <Text style={styles.featureDescription}>
                Access scientifically-designed workout routines crafted by fitness experts
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="camera-outline" size={28} color="#FFD700" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>AI Photo Analysis</Text>
              <Text style={styles.featureDescription}>
                Revolutionary photo-to-meal planning with unlimited uploads
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="restaurant-outline" size={28} color="#FFD700" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Gourmet Meal Plans</Text>
              <Text style={styles.featureDescription}>
                Premium nutrition plans with chef-curated recipes and detailed macros
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="analytics-outline" size={28} color="#FFD700" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Advanced Analytics</Text>
              <Text style={styles.featureDescription}>
                Comprehensive progress tracking with personalized insights and reports
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="headset-outline" size={28} color="#FFD700" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>VIP Support</Text>
              <Text style={styles.featureDescription}>
                24/7 priority access to our dedicated wellness consultants
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.pricingContainer}>
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.1)', 'rgba(255, 140, 0, 0.1)']}
            style={styles.pricingCard}>
            <Text style={styles.pricingTitle}>Premium Membership</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>Rp 1,000,000</Text>
              <Text style={styles.pricePeriod}>/ month</Text>
            </View>
            <Text style={styles.pricingNote}>
              • Cancel anytime • Instant activation • Premium support
            </Text>
            <View style={styles.valueBadge}>
              <Text style={styles.valueBadgeText}>Best Value</Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Go Premium Button */}
      <SafeAreaView>
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.premiumButton, loading && styles.premiumButtonDisabled]}
            onPress={handleGoPremium}
            disabled={loading}>
            <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.premiumButtonGradient}>
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.premiumButtonText}>Processing...</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="star" size={20} color="#FFFFFF" />
                  <Text style={styles.premiumButtonText}>Upgrade to Premium</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  bannerContainer: {
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
  },
  premiumIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  bannerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  featuresTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  pricingContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  pricingCard: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    position: 'relative',
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  pricePeriod: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 6,
  },
  pricingNote: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  valueBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#FF4500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  valueBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  premiumButton: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  premiumButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  premiumButtonDisabled: {
    opacity: 0.7,
  },
  premiumButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
