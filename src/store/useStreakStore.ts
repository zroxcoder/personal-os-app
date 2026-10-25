// src/store/useStreakStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PetStage {
  minDays: number;
  emoji: string;
  name: string;
  bg: string;
}

// Pet evolution stages
export const PET_STAGES: PetStage[] = [
  { minDays: 0,   emoji: '🥚', name: 'Egg',              bg: '#FEF3C7' },
  { minDays: 3,   emoji: '🐣', name: 'Hatching',         bg: '#FDE68A' },
  { minDays: 7,   emoji: '🐥', name: 'Chick',            bg: '#FDE047' },
  { minDays: 14,  emoji: '🐤', name: 'Bird',             bg: '#FCA5A5' },
  { minDays: 30,  emoji: '🦅', name: 'Eagle',            bg: '#F87171' },
  { minDays: 60,  emoji: '🦉', name: 'Wise Owl',         bg: '#A78BFA' },
  { minDays: 100, emoji: '🦄', name: 'Unicorn',          bg: '#F9A8D4' },
  { minDays: 200, emoji: '🐲', name: 'Dragon',           bg: '#F59E0B' },
  { minDays: 365, emoji: '🐉', name: 'Legendary Dragon', bg: '#EF4444' },
];

interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastOpenDate: string;
  totalDaysOpened: number;
  checkIn: () => void;
  reset: () => void;
}

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      currentStreak: 0,
      longestStreak: 0,
      lastOpenDate: '',
      totalDaysOpened: 0,

      checkIn: () => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];

        // Already checked in today
        if (state.lastOpenDate === today) return;

        // Compute yesterday
        const y = new Date();
        y.setDate(y.getDate() - 1);
        const yesterdayStr = y.toISOString().split('T')[0];

        let newStreak: number;

        if (state.lastOpenDate === '') {
          // First ever launch
          newStreak = 1;
        } else if (state.lastOpenDate === yesterdayStr) {
          // Consecutive day — increment
          newStreak = state.currentStreak + 1;
        } else {
          // Missed at least one day — reset to 1 (day 1 of new streak)
          newStreak = 1;
        }

        set({
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, state.longestStreak),
          lastOpenDate: today,
          totalDaysOpened: state.totalDaysOpened + 1,
        });
      },

      reset: () => set({
        currentStreak: 0,
        longestStreak: 0,
        lastOpenDate: '',
        totalDaysOpened: 0,
      }),
    }),
    {
      name: 'personal-os-streak',
      storage: createJSONStorage(() => AsyncStorage),
      // ✅ Auto check-in after hydration completes
      onRehydrateStorage: () => (state) => {
        state?.checkIn();
      },
    }
  )
);

// ---- Helper: get current and next pet stages ----
export function getPetStage(streak: number) {
  let current = PET_STAGES[0];
  let next: PetStage | null = PET_STAGES[1];

  for (let i = 0; i < PET_STAGES.length; i++) {
    if (streak >= PET_STAGES[i].minDays) {
      current = PET_STAGES[i];
      next = PET_STAGES[i + 1] ?? null;
    }
  }

  return { current, next };
}

// ---- Helper: dynamic encouragement message ----
export function getStreakMessage(streak: number, longest: number): string {
  if (streak === 0) return 'Open the app daily to hatch your egg! 🥚';
  if (streak === 1 && longest > 3) return `Fresh start! Your best was ${longest} days. 💪`;
  if (streak === 1) return 'Day 1! Come back tomorrow to grow your streak. 🌱';
  if (streak < 3) return 'The egg is warming up... keep going! 🥚';
  if (streak < 7) return 'Something is moving in the egg! 🐣';
  if (streak < 14) return 'Your chick is growing fast! 🐥';
  if (streak < 30) return 'Your bird is spreading its wings! 🐤';
  if (streak < 60) return 'An eagle in the making! 🦅';
  if (streak < 100) return 'Wise owl status unlocked! 🦉';
  if (streak < 200) return 'A majestic unicorn appears! 🦄';
  if (streak < 365) return 'Your dragon is growing powerful! 🐲';
  return 'LEGENDARY! You raised a true dragon! 🐉';
}