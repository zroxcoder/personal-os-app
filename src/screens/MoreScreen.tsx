// src/screens/MoreScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BookOpen, Wallet, Lock, User, Settings, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { useProfileStore } from '../store/useProfileStore';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';

export default function MoreScreen() {
  const navigation = useNavigation<any>();
  const { name, avatarColor, avatarEmoji } = useProfileStore();

  const menuItems = [
    { name: 'Projects', icon: BookOpen, route: 'Projects' },
    { name: 'Expenses', icon: Wallet, route: 'Expenses' },
    { name: 'Passwords', icon: Lock, route: 'Passwords' },
    { name: 'Profile', icon: User, route: 'Profile' },
    { name: 'Settings', icon: Settings, route: 'Settings' },
  ];

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
          {/* Page Title */}
          <View style={styles.header}>
            <Text style={styles.pageTitle}>More</Text>
          </View>

          {/* Profile Header Card */}
          <GlassCard style={styles.profileCard}>
            {/* ✅ Avatar uses the color + emoji from the store */}
            <View style={[styles.avatar, { backgroundColor: avatarColor || COLORS.primary }]}>
              <Text style={styles.avatarEmoji}>{avatarEmoji || '🚀'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{name || 'User'}</Text>
              <Text style={styles.subtitle}>Personal OS</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <ChevronRight color={COLORS.textLight} size={22} />
            </TouchableOpacity>
          </GlassCard>

          {/* Menu List */}
          <GlassCard style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.name}
                style={[styles.menuItem, index !== menuItems.length - 1 && styles.menuItemBorder]}
                onPress={() => item.route && navigation.navigate(item.route)}
              >
                <View style={styles.menuLeft}>
                  <View style={styles.iconBox}>
                    <item.icon color={COLORS.primary} size={20} />
                  </View>
                  <Text style={styles.menuText}>{item.name}</Text>
                </View>
                <ChevronRight color={COLORS.textLight} size={20} />
              </TouchableOpacity>
            ))}
          </GlassCard>

          <Text style={styles.versionText}>Personal OS v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { marginTop: 10, marginBottom: 20 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.textDark },

  // Profile Card
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 15, marginBottom: 20 },
  avatar: {
    width: 55, height: 55, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 15,
  },
  avatarEmoji: { fontSize: 26 },

  name: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  subtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 2, fontWeight: '500' },

  // Menu
  menuContainer: { paddingHorizontal: 15 },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 15,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(46, 74, 53, 0.1)',
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  menuText: { color: COLORS.textDark, fontSize: 16, fontWeight: '600' },

  versionText: { textAlign: 'center', color: COLORS.textLight, fontSize: 12, marginTop: 30, fontWeight: '500' },
});