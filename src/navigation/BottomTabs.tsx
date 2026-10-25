// src/navigation/BottomTabs.tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, CheckSquare, Calendar, FileText, Menu } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

import HomeScreen from '../screens/HomeScreen';
import TasksScreen from '../screens/TasksScreen';
import PlannerScreen from '../screens/PlannerScreen';
import NotesScreen from '../screens/NotesScreen';
import MoreScreen from '../screens/MoreScreen';
import { COLORS } from '../theme/colors';

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -5,
        },
        // Floating Glass Style
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          elevation: 0,
          backgroundColor: 'transparent', // Must be transparent for BlurView to show
          borderRadius: 25,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        // Background Blur
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="light"
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: 25, overflow: 'hidden' } // Match tabBarStyle border radius
            ]}
          />
        ),
        // Icons
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') return <Home color={color} size={size} />;
          if (route.name === 'Tasks') return <CheckSquare color={color} size={size} />;
          if (route.name === 'Planner') return <Calendar color={color} size={size} />;
          if (route.name === 'Notes') return <FileText color={color} size={size} />;
          if (route.name === 'More') return <Menu color={color} size={size} />;
          return null;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Planner" component={PlannerScreen} />
      <Tab.Screen name="Notes" component={NotesScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}