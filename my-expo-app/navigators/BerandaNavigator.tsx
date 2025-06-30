import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';

// Import only main tab screens
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import AccountScreen from '../screens/AccountScreen';
import AddPlanScreen from '../screens/AddPlanScreen';
import PlansTypeScreen from '../screens/PlansTypeScreen';

const Tab = createBottomTabNavigator();

export default function BerandaNavigator() {
  return (
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

      {/* Search Tab */}
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
        }}
      />

      {/* Plans Tab - Mengarah ke PlansTypeScreen */}
      <Tab.Screen
        name="Plans"
        component={PlansTypeScreen}
        options={{
          tabBarLabel: 'Plans',
        }}
      />

      {/* Add Button (Floating) */}
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
                width: 70,
                height: 70,
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

      {/* Account Tab */}
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarLabel: 'Account',
        }}
      />
    </Tab.Navigator>
  );
}
