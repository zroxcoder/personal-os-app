// src/screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Clock, CloudSun, Target, Folder, MapPin, AlertCircle, Flame, Trophy, Calendar, ChevronRight } from 'lucide-react-native';
import * as Location from 'expo-location';
import { COLORS } from '../theme/colors';
import { useTaskStore } from '../store/useTaskStore';
import { useProfileStore } from '../store/useProfileStore';
import { useProjectStore } from '../store/useProjectStore';
import { useStreakStore, getPetStage, getStreakMessage } from '../store/useStreakStore';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { tasks } = useTaskStore();
  const { name } = useProfileStore();
  const { projects } = useProjectStore();
  const { currentStreak, longestStreak, totalDaysOpened } = useStreakStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [weather, setWeather] = useState<{ temp: string; condition: string } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [petMessage, setPetMessage] = useState<string | null>(null);
  const [petScale] = useState(new Animated.Value(1));

  const { current: petStage, next: nextStage } = getPetStage(currentStreak);

  // Greeting
  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    const hour = currentDate.getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
    return () => clearInterval(timer);
  }, [currentDate]);

  // Weather
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setWeatherLoading(false);
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}&current_weather=true&temperature_unit=celsius`
        );
        const data = await response.json();
        if (data.current_weather) {
          setWeather({
            temp: `${Math.round(data.current_weather.temperature)}°C`,
            condition: getWeatherCondition(data.current_weather.weathercode),
          });
        }
      } catch (error) {
        console.log('Weather fetch error:', error);
      } finally {
        setWeatherLoading(false);
      }
    })();
  }, []);

  const getWeatherCondition = (code: number) => {
    if (code === 0) return 'Clear Sky';
    if (code >= 1 && code <= 3) return 'Partly Cloudy';
    if (code >= 45 && code <= 48) return 'Foggy';
    if (code >= 51 && code <= 67) return 'Rainy';
    if (code >= 71 && code <= 77) return 'Snowy';
    if (code >= 80 && code <= 82) return 'Showers';
    return 'Cloudy';
  };

  // Pet tap animation
  const handlePetTap = () => {
    Animated.sequence([
      Animated.timing(petScale, { toValue: 1.15, duration: 120, useNativeDriver: true }),
      Animated.timing(petScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    const messages = [
      'Keep going! 💪',
      "You're doing great! ✨",
      "Don't break the chain! 🔥",
      'Almost to the next form! 🌟',
      'Come back tomorrow! 👋',
      'I believe in you! 💫',
      'One day at a time! 🌱',
    ];
    setPetMessage(messages[Math.floor(Math.random() * messages.length)]);
    setTimeout(() => setPetMessage(null), 2500);
  };

  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

  // Task logic
  const today = new Date().toISOString().split('T')[0];
  const todaysTasks = tasks.filter(task => task.date === today);
  const completedTasks = todaysTasks.filter(task => task.completed).length;
  const totalTasks = todaysTasks.length;
  const progressPercentage = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;
  const upcomingTask = todaysTasks.find(task => !task.completed);

  // Project deadline logic
  const nearDeadlines = projects.filter(p => {
    const deadline = new Date(p.deadlineDate);
    const t = new Date();
    const diffTime = Math.abs(deadline.getTime() - t.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isCompleted = p.subtasks.length > 0 && p.subtasks.every(s => s.completed);
    return diffDays <= 7 && !isCompleted && deadline >= t;
  }).sort((a, b) => new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime());

  // Evolution progress
  const evolutionProgress = nextStage
    ? Math.min(100, ((currentStreak - petStage.minDays) / (nextStage.minDays - petStage.minDays)) * 100)
    : 100;
  const daysToNext = nextStage ? Math.max(0, nextStage.minDays - currentStreak) : 0;

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{greeting},</Text>
              <Text style={styles.name}>{name || 'User'}! 👋</Text>
              <Text style={styles.date}>{formattedDate}</Text>
            </View>
            <GlassCard style={styles.weatherCard}>
              {weatherLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : weather ? (
                <>
                  <CloudSun color={COLORS.textDark} size={24} />
                  <Text style={styles.weatherText}>{weather.temp}</Text>
                  <Text style={styles.weatherSub}>{weather.condition}</Text>
                </>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <MapPin color={COLORS.textLight} size={20} />
                  <Text style={styles.weatherSub}>Off</Text>
                </View>
              )}
            </GlassCard>
          </View>

          {/* Quote */}
          <GlassCard style={styles.quoteBox}>
            <Text style={styles.quoteText}>"Small steps every day lead to big results."</Text>
          </GlassCard>

          {/* ============ STREAK PET ============ */}
          <Text style={styles.sectionTitle}>Streak Pet</Text>
          <GlassCard style={styles.petCard}>
            {/* Pet emoji in colored circle (tap to interact) */}
            <TouchableOpacity onPress={handlePetTap} activeOpacity={0.7}>
              <Animated.View
                style={[
                  styles.petCircle,
                  { backgroundColor: petStage.bg, transform: [{ scale: petScale }] },
                ]}
              >
                <Text style={styles.petEmoji}>{petStage.emoji}</Text>
              </Animated.View>
            </TouchableOpacity>

            {/* Pet name + streak */}
            <Text style={styles.petName}>{petStage.name}</Text>
            <Text style={styles.petDay}>Day {currentStreak}</Text>

            {/* Dynamic message or pet reaction */}
            <Text style={styles.petMessage}>
              {petMessage || getStreakMessage(currentStreak, longestStreak)}
            </Text>

            {/* Progress to next evolution */}
            {nextStage ? (
              <>
                <View style={styles.petProgressBar}>
                  <View style={[styles.petProgressFill, { width: `${evolutionProgress}%` }]} />
                </View>
                <Text style={styles.petProgressText}>
                  {daysToNext} {daysToNext === 1 ? 'day' : 'days'} to unlock {nextStage.emoji} {nextStage.name}
                </Text>
              </>
            ) : (
              <Text style={[styles.petProgressText, { color: '#EF4444', fontWeight: '700' }]}>
                🎉 Max evolution reached!
              </Text>
            )}

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Flame color="#FF6B6B" size={16} />
                <Text style={styles.statValue}>{currentStreak}</Text>
                <Text style={styles.statLabel}>Current</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Trophy color="#FFB020" size={16} />
                <Text style={styles.statValue}>{longestStreak}</Text>
                <Text style={styles.statLabel}>Best</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Calendar color={COLORS.primary} size={16} />
                <Text style={styles.statValue}>{totalDaysOpened}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </GlassCard>

          {/* ============ FOCUS TIMER ============ */}
          <TouchableOpacity onPress={() => navigation.navigate('FocusTimer')} activeOpacity={0.85}>
            <GlassCard style={styles.focusCard}>
              <View style={styles.focusLeft}>
                <View style={styles.focusIconBox}>
                  <Clock color={COLORS.primary} size={24} />
                </View>
                <View>
                  <Text style={styles.focusTitle}>Focus Timer</Text>
                  <Text style={styles.focusSub}>Start a deep work session</Text>
                </View>
              </View>
              <ChevronRight color={COLORS.textLight} size={22} />
            </GlassCard>
          </TouchableOpacity>

          {/* Today's Progress */}
          <GlassCard style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.sectionTitle}>Today's Progress</Text>
              <Text style={styles.progressText}>{completedTasks}/{totalTasks}</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressSub}>Tasks completed</Text>
          </GlassCard>

          {/* Upcoming Task */}
          <Text style={styles.sectionTitle}>Upcoming Task</Text>
          {upcomingTask ? (
            <GlassCard style={styles.upcomingCard}>
              <View style={styles.upcomingLeft}>
                <Target color={COLORS.primary} size={20} />
                <View style={styles.upcomingTextContainer}>
                  <Text style={styles.upcomingTitle}>{upcomingTask.title}</Text>
                  <Text style={styles.upcomingTime}>{upcomingTask.time}</Text>
                </View>
              </View>
            </GlassCard>
          ) : (
            <GlassCard style={styles.upcomingCard}>
              <Text style={{ color: COLORS.textLight }}>All tasks completed for today! 🎉</Text>
            </GlassCard>
          )}

          {/* Project Deadlines */}
          {nearDeadlines.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Project Deadlines</Text>
              {nearDeadlines.map(project => (
                <TouchableOpacity key={project.id} onPress={() => navigation.navigate('Projects')}>
                  <GlassCard style={styles.deadlineCard}>
                    <View style={styles.upcomingLeft}>
                      <AlertCircle color="#FF6B6B" size={20} />
                      <View style={styles.upcomingTextContainer}>
                        <Text style={styles.upcomingTitle}>{project.title}</Text>
                        <Text style={styles.deadlineTime}>
                          Due: {new Date(project.deadlineDate).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </>
          )}

        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 16, color: COLORS.textLight, fontWeight: '500' },
  name: { fontSize: 28, fontWeight: 'bold', color: COLORS.textDark },
  date: { fontSize: 12, color: COLORS.textLight, marginTop: 4, fontWeight: '500' },
  weatherCard: { alignItems: 'center', padding: 12, borderRadius: 16, minWidth: 80 },
  weatherText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark, marginTop: 4 },
  weatherSub: { fontSize: 10, color: COLORS.textLight, marginTop: 2 },

  // Quote
  quoteBox: { padding: 20, marginBottom: 25 },
  quoteText: { color: COLORS.primary, fontSize: 15, fontStyle: 'italic', fontWeight: '500' },

  // Section
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 12 },

  // ===== STREAK PET =====
  petCard: { padding: 20, alignItems: 'center', marginBottom: 20 },
  petCircle: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
  },
  petEmoji: { fontSize: 56 },
  petName: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  petDay: { fontSize: 13, color: COLORS.primary, fontWeight: '700', marginTop: 2, letterSpacing: 0.5 },
  petMessage: {
    fontSize: 13, color: COLORS.textLight, textAlign: 'center',
    marginTop: 10, marginBottom: 15, fontStyle: 'italic', paddingHorizontal: 10,
  },
  petProgressBar: {
    width: '100%', height: 8, backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 4, marginBottom: 8, overflow: 'hidden',
  },
  petProgressFill: { height: 8, backgroundColor: COLORS.accent, borderRadius: 4 },
  petProgressText: { fontSize: 11, color: COLORS.textLight, fontWeight: '600', marginBottom: 15 },

  statsRow: {
    flexDirection: 'row', width: '100%',
    paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginTop: 4 },
  statLabel: { fontSize: 11, color: COLORS.textLight, marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: 'rgba(0,0,0,0.08)', marginVertical: 4 },

  // ===== FOCUS TIMER =====
  focusCard: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 18, marginBottom: 25,
  },
  focusLeft: { flexDirection: 'row', alignItems: 'center' },
  focusIconBox: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: 'rgba(46, 74, 53, 0.1)',
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  focusTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
  focusSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

  // Progress
  progressSection: { padding: 20, marginBottom: 25 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressText: { fontWeight: 'bold', color: COLORS.textDark, fontSize: 16 },
  progressBarBg: { height: 10, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 5, marginBottom: 10 },
  progressBarFill: { height: 10, backgroundColor: COLORS.accent, borderRadius: 5 },
  progressSub: { fontSize: 13, color: COLORS.textLight, fontWeight: '500' },

  // Upcoming
  upcomingCard: { padding: 20, marginBottom: 20 },
  upcomingLeft: { flexDirection: 'row', alignItems: 'center' },
  upcomingTextContainer: { marginLeft: 15 },
  upcomingTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textDark },
  upcomingTime: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },

  // Deadline
  deadlineCard: { padding: 20, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#FF6B6B' },
  deadlineTime: { fontSize: 13, color: '#FF6B6B', marginTop: 4, fontWeight: '600' },
});