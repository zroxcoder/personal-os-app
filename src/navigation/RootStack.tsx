// src/navigation/RootStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabs from './BottomTabs';
import ProjectsScreen from '../screens/ProjectsScreen';
import FocusTimerScreen from '../screens/FocusTimerScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import SplashScreen from '../screens/SplashScreen';
import PasswordsScreen from '../screens/PasswordsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function RootStack() {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="MainTabs" component={BottomTabs} />
      <Stack.Screen name="Projects" component={ProjectsScreen} />
      <Stack.Screen name="FocusTimer" component={FocusTimerScreen} />
      <Stack.Screen name="Expenses" component={ExpensesScreen} />
      <Stack.Screen name="Passwords" component={PasswordsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}