// App.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';
import RootStack from './src/navigation/RootStack';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Hide the bottom navigation bar
      NavigationBar.setVisibilityAsync('hidden');
    }
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootStack />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}