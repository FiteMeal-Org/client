import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import PlansScreen from '../screens/PlansScreen';
import AccountScreen from '../screens/AccountScreen';
import AddPlanScreen from '../screens/AddPlanScreen';
import AddExerciseScreen from '../screens/AddExerciseScreen';
import PlanSelectionScreen from '../screens/PlanSelectionScreen';
import ProfileFormScreen from '../screens/ProfileFormScreen';
import UploadImageScreen from '../screens/UploadImageScreen';
import MealExercisePlanScreen from '../screens/MealExercisePlanScreen';

const Tab = createBottomTabNavigator();

export default function BerandaNavigator() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: any = 'home';

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Search') {
                iconName = focused ? 'search' : 'search-outline';
              } else if (route.name === 'Plans') {
                iconName = focused ? 'calendar' : 'calendar-outline';
              } else if (route.name === 'Account') {
                iconName = focused ? 'person' : 'person-outline';
              } else if (route.name === 'Upload') {
                iconName = focused ? 'cloud-upload' : 'cloud-upload-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#8B4A6B',
            tabBarInactiveTintColor: '#666',
            tabBarStyle: {
              backgroundColor: 'white',
              borderTopWidth: 1,
              borderTopColor: '#E0E0E0',
              paddingBottom: 10,
              paddingTop: 5,
              height: 65,
              position: 'absolute',
              bottom: 0,
            },
            tabBarLabelStyle: {
              fontSize: 10,
              marginBottom: 5,
            },
            headerShown: false,
          })}>
          <Tab.Screen
            name="Home"
            options={{
              tabBarLabel: 'Home',
            }}>
            {(props) => (
              <HomeScreen
                {...props}
                onNavigate={(screen) => {
                  console.log('🧭 Navigation requested to screen:', screen);
                  props.navigation.navigate(screen);
                }}
              />
            )}
          </Tab.Screen>
          <Tab.Screen
            name="Search"
            component={SearchScreen}
            options={{
              tabBarLabel: 'Search',
            }}
          />

          <Tab.Screen
            name="Plans"
            options={{
              tabBarLabel: 'Plans',
            }}>
            {(props) => (
              <PlansScreen
                {...props}
                onNavigate={(screen: string, params?: any) => {
                  if (params) {
                    props.navigation.navigate(screen, params);
                  } else {
                    props.navigation.navigate(screen);
                  }
                }}
              />
            )}
          </Tab.Screen>
          <Tab.Screen
            name="Add"
            component={AddPlanScreen}
            options={{
              tabBarButton: (props) => (
                <TouchableOpacity
                  style={{
                    top: -10,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={(e) => {
                    props.onPress && props.onPress(e);
                  }}>
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: '#8B4A6B',
                      justifyContent: 'center',
                      alignItems: 'center',
                      elevation: 3,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                    }}>
                    <Ionicons name="add" size={30} color="white" />
                  </View>
                </TouchableOpacity>
              ),
            }}
          />

          <Tab.Screen
            name="UploadImageScreen"
            component={UploadImageScreen}
            options={{
              tabBarButton: () => null, // Hide from tab bar
              headerShown: false,
            }}
          />

          <Tab.Screen
            name="Account"
            options={{
              tabBarLabel: 'Account',
            }}>
            {(props) => (
              <AccountScreen
                {...props}
                onNavigate={(screen) => props.navigation.navigate(screen)}
              />
            )}
          </Tab.Screen>

          {/* Add PlanSelection screen (hidden from tab bar) */}
          <Tab.Screen
            name="PlanSelection"
            component={PlanSelectionScreen}
            options={{
              tabBarButton: () => null, // Hide from tab bar
              headerShown: false,
            }}
          />

          {/* Add AddExercise screen (hidden from tab bar) */}
          <Tab.Screen
            name="AddExercise"
            component={AddExerciseScreen}
            options={{
              tabBarButton: () => null, // Hide from tab bar
              headerShown: false,
            }}
          />

          {/* Add ProfileForm screen (hidden from tab bar) */}
          <Tab.Screen
            name="ProfileForm"
            options={{
              tabBarButton: () => null, // Hide from tab bar
              headerShown: false,
            }}>
            {(props) => (
              <ProfileFormScreen
                {...props}
              />
            )}
          </Tab.Screen>

          {/* Add MealExercisePlan screen (hidden from tab bar) */}
          <Tab.Screen
            name="MealExercisePlan"
            component={MealExercisePlanScreen}
            options={{
              tabBarButton: () => null, // Hide from tab bar
              headerShown: false,
            }}
          />
        </Tab.Navigator>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
