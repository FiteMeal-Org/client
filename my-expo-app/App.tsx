import React, { createContext, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import RegisterScreen from './screens/RegisterScreen';
import LoginScreen from './screens/LoginScreen';
import BerandaNavigator from 'navigators/BerandaNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import UploadImageScreen from './screens/UploadImageScreen';

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
  const [token, setToken] = useState<string | null>(''); // ini nanti diisi token

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
              {/* <StatusBar style="light" /> */}
              <Stack.Screen name="BerandaNavigator" component={BerandaNavigator} />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="UploadImageScreen" component={UploadImageScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
