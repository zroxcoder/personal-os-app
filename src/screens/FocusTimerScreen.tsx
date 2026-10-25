// src/screens/FocusTimerScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Play, Pause, RotateCcw, Settings } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../theme/colors';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';

const MODES = {
  Focus: 25 * 60,
  ShortBreak: 5 * 60,
  LongBreak: 15 * 60,
};

type ModeType = keyof typeof MODES;

export default function FocusTimerScreen() {
  const navigation = useNavigation();
  
  const [mode, setMode] = useState<ModeType>('Focus');
  const [timeLeft, setTimeLeft] = useState(MODES.Focus);
  const [isRunning, setIsRunning] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleModeChange = (newMode: ModeType) => {
    setMode(newMode);
    setTimeLeft(MODES[newMode]);
    setIsRunning(false);
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(MODES[mode]);
  };

  const radius = 120;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const totalTime = MODES[mode];
  const strokeDashoffset = circumference - (timeLeft / totalTime) * circumference;

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft color={COLORS.textDark} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Focus Timer</Text>
          <TouchableOpacity>
            <Settings color={COLORS.textDark} size={24} />
          </TouchableOpacity>
        </View>

        <GlassCard style={styles.modeContainer}>
          {(['Focus', 'ShortBreak', 'LongBreak'] as ModeType[]).map((m) => (
            <TouchableOpacity 
              key={m}
              style={[styles.modeButton, mode === m && styles.modeButtonActive]}
              onPress={() => handleModeChange(m)}
            >
              <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>
                {m === 'ShortBreak' ? 'Short Break' : m === 'LongBreak' ? 'Long Break' : 'Focus'}
              </Text>
            </TouchableOpacity>
          ))}
        </GlassCard>

        <View style={styles.timerContainer}>
          <Svg width={280} height={280} viewBox="0 0 280 280">
            <Circle cx="140" cy="140" r={radius} stroke="rgba(0,0,0,0.05)" strokeWidth={strokeWidth} fill="transparent" />
            <Circle
              cx="140" cy="140" r={radius} stroke={COLORS.primary} strokeWidth={strokeWidth} fill="transparent"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform="rotate(-90 140 140)"
            />
          </Svg>
          
          <View style={styles.timeOverlay}>
            <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>
            <Text style={styles.timeLabel}>Focus Time</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={resetTimer}>
            <GlassCard style={styles.resetButton}>
              <RotateCcw color={COLORS.textDark} size={24} />
            </GlassCard>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.playButton} onPress={toggleTimer}>
            {isRunning ? <Pause color="#FFF" size={32} /> : <Play color="#FFF" size={32} style={{ marginLeft: 4 }} />}
          </TouchableOpacity>
          
          <View style={{ width: 50 }} /> 
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 30 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark },
  modeContainer: { flexDirection: 'row', justifyContent: 'center', borderRadius: 30, padding: 5, marginBottom: 40 },
  modeButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 25 },
  modeButtonActive: { backgroundColor: 'rgba(46, 74, 53, 0.8)' },
  modeText: { fontSize: 14, fontWeight: '500', color: COLORS.textDark },
  modeTextActive: { color: '#FFF', fontWeight: 'bold' },
  timerContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 50 },
  timeOverlay: { position: 'absolute', alignItems: 'center' },
  timeText: { fontSize: 56, fontWeight: 'bold', color: COLORS.textDark },
  timeLabel: { fontSize: 14, color: COLORS.textLight, marginTop: 5, fontWeight: '500' },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  playButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginHorizontal: 30, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  resetButton: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
});