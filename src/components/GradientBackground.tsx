// src/components/GradientBackground.tsx
import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export default function GradientBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.container}>
      {/* Base Gradient */}
      <LinearGradient
        colors={['#F0F4F0', '#E2EBE4', '#D1DFD5']} // Soft green/grey gradient
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative Glowing Orbs behind the glass */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
      <View style={[styles.orb, styles.orb3]} />

      {/* The actual app content */}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb: {
    position: 'absolute',
    borderRadius: 150,
  },
  orb1: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(76, 175, 80, 0.3)', // Green orb
    top: -50,
    left: -50,
  },
  orb2: {
    width: 250,
    height: 250,
    backgroundColor: 'rgba(255, 193, 7, 0.2)', // Yellow orb
    top: height * 0.4,
    right: -50,
  },
  orb3: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(33, 150, 243, 0.2)', // Blue orb
    bottom: -50,
    left: width * 0.2,
  },
});