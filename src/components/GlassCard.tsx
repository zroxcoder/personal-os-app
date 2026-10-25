// src/components/GlassCard.tsx
import React from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}

export default function GlassCard({ children, style, intensity = 50 }: GlassCardProps) {
  return (
    <BlurView intensity={intensity} tint="light" style={[styles.glass, style]}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // Semi-transparent white
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)', // Subtle white border for the glass edge
    borderRadius: 16,
    overflow: 'hidden', // Ensures blur stays inside borders
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
});