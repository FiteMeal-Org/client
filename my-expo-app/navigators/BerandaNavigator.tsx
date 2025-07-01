import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';

// Import only main tab screens
import HomeScreen from '../screens/HomeScreen';
import AddPlanScreen from '../screens/AddPlanScreen';
import PlansTypeScreen from '../screens/PlansTypeScreen';
import AccountScreen from '../screens/AccountScreen';

const Tab = createBottomTabNavigator();

export default function BerandaNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Plans') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
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
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          marginBottom: 5,
        },
        headerShown: false,
      })}>
      {/* Home Tab */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />

      {/* Add Button */}
      <Tab.Screen
        name="Add"
        component={AddPlanScreen}
        options={{
          tabBarLabel: 'Add',
          tabBarIcon: ({ focused, color, size }) => (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: focused ? '#8B4A6B' : '#F3F4F6',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 4,
              }}>
              <Ionicons
                name={focused ? 'add' : 'add-outline'}
                size={24}
                color={focused ? 'white' : '#8B4A6B'}
              />
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 10,
            marginBottom: 5,
            marginTop: -4,
          },
        }}
      />

      {/* Plans Tab */}
      <Tab.Screen
        name="Plans"
        component={PlansTypeScreen}
        options={{
          tabBarLabel: 'Plans',
        }}
      />

      {/* Profile Tab */}
      <Tab.Screen
        name="Profile"
        component={AccountScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}
