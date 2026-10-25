// src/screens/SplashScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Leaf } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';

export default function SplashScreen() {
  const navigation = useNavigation<any>();

  useEffect(() => {
    // Navigate to MainTabs after 2.5 seconds
    const timer = setTimeout(() => {
      navigation.replace('MainTabs');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Content */}
      <View style={styles.topContent}>
        <View style={styles.logoContainer}>
          <Leaf color="#FFF" size={40} />
        </View>
        <Text style={styles.title}>Personal OS</Text>
        <Text style={styles.subtitle}>Your life. Organized.</Text>
      </View>

      {/* Bottom Content */}
      <View style={styles.bottomContent}>
        <Text style={styles.bottomText}>Plan  •  Study  •  Build  •  Grow</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2E22', // Dark green background
    justifyContent: 'space-between',
  },
  topContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  logoContainer: {
    marginBottom: 20,
    // If you had the leaf image, you'd use an <Image> here instead
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  bottomContent: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  bottomText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 2,
  },
});