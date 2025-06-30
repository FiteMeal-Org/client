import React, { createContext, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import RegisterScreen from './screens/RegisterScreen';
import LoginScreen from './screens/LoginScreen';
import BerandaNavigator from 'navigators/BerandaNavigator';
import * as SecureStore from 'expo-secure-store';

// Import semua screens yang dipindahkan dari BerandaNavigator
import UploadImageScreen from './screens/UploadImageScreen';
import PlansScreen from './screens/PlansScreen';
import ExercisePlansScreen from './screens/ExercisePlansScreen';
import PlanSelectionScreen from './screens/PlanSelectionScreen';
import AddExerciseScreen from './screens/AddExerciseScreen';
import ProfileFormScreen from './screens/ProfileFormScreen';
import MealExercisePlanScreen from './screens/MealExercisePlanScreen';
import AddCompletePlan from './screens/AddCompletePlan';

type IAuthContext = {
  token: string | null;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
};

const Stack = createNativeStackNavigator();

export const AuthContext = createContext<IAuthContext>({
  token: '',
  setToken: () => {},
});

export default function App() {
  const [token, setToken] = useState<string | null>('');

  async function checkToken() {
    const access_token = await SecureStore.getItemAsync('access_token');
    const userId = await SecureStore.getItemAsync('user_id');
    console.log(userId, 'ini userId di cookies');

    setToken(access_token);
  }

  useEffect(() => {
    checkToken();
  }, []);

  return (
    <AuthContext.Provider value={{ token, setToken }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          {token ? (
            <>
              <Stack.Screen name="BerandaNavigator" component={BerandaNavigator} />

              {/* Stack Screens - Semua screens yang sebelumnya hidden di BerandaNavigator */}
              <Stack.Screen name="UploadImageScreen" component={UploadImageScreen} />
              <Stack.Screen name="PlansScreen" component={PlansScreen} />
              <Stack.Screen name="ExercisePlansScreen" component={ExercisePlansScreen} />
              <Stack.Screen name="PlanSelection" component={PlanSelectionScreen} />
              <Stack.Screen name="AddExercise" component={AddExerciseScreen} />
              <Stack.Screen name="ProfileForm" component={ProfileFormScreen} />
              <Stack.Screen name="MealExercisePlan" component={MealExercisePlanScreen} />
              <Stack.Screen name="AddCompletePlan" component={AddCompletePlan} />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
