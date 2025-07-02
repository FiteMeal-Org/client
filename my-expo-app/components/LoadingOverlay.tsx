import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  type?: 'generate' | 'upload' | 'create' | 'default';
}

export default function LoadingOverlay({
  visible,
  message = 'Processing...',
  type = 'default',
}: LoadingOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Start continuous rotation for the loading ring
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
    } else {
      // Exit animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getLoadingConfig = () => {
    switch (type) {
      case 'generate':
        return {
          color: '#8B0000',
          icon: '🔮',
          title: 'Generating Your Plan',
          subtitle: 'AI is creating personalized content...',
        };
      case 'upload':
        return {
          color: '#059669',
          icon: '📸',
          title: 'Uploading Photo',
          subtitle: 'Processing your image...',
        };
      case 'create':
        return {
          color: '#7C3AED',
          icon: '✨',
          title: 'Creating Plan',
          subtitle: 'Setting up your personalized plan...',
        };
      default:
        return {
          color: '#6B7280',
          icon: '⏳',
          title: 'Loading',
          subtitle: message,
        };
    }
  };

  const config = getLoadingConfig();

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}>
          {/* Loading Ring */}
          <View style={styles.loadingRingContainer}>
            <Animated.View
              style={[
                styles.loadingRing,
                {
                  borderTopColor: config.color,
                  transform: [{ rotate: spin }],
                },
              ]}
            />
            <View style={[styles.innerCircle, { backgroundColor: config.color + '20' }]}>
              <Text style={styles.loadingIcon}>{config.icon}</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: config.color }]}>{config.title}</Text>
            <Text style={styles.subtitle}>{config.subtitle}</Text>

            {/* Dots animation */}
            <View style={styles.dotsContainer}>
              {[0, 1, 2].map((index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    { backgroundColor: config.color },
                    {
                      opacity: rotateAnim.interpolate({
                        inputRange: [0, 0.33, 0.66, 1],
                        outputRange:
                          index === 0
                            ? [1, 0.3, 0.3, 1]
                            : index === 1
                              ? [0.3, 1, 0.3, 0.3]
                              : [0.3, 0.3, 1, 0.3],
                      }),
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    maxWidth: width * 0.8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  loadingRingContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopWidth: 4,
  },
  innerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    fontSize: 24,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
