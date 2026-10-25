// src/store/useSettingsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  taskRemindersEnabled: boolean;
  billRemindersEnabled: boolean;
  projectRemindersEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  toggleTaskReminders: () => void;
  toggleBillReminders: () => void;
  toggleProjectReminders: () => void;
  toggleSound: () => void;
  toggleVibration: () => void;
  reset: () => void;
}

const defaults = {
  taskRemindersEnabled: true,
  billRemindersEnabled: true,
  projectRemindersEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      toggleTaskReminders: () => set(s => ({ taskRemindersEnabled: !s.taskRemindersEnabled })),
      toggleBillReminders: () => set(s => ({ billRemindersEnabled: !s.billRemindersEnabled })),
      toggleProjectReminders: () => set(s => ({ projectRemindersEnabled: !s.projectRemindersEnabled })),
      toggleSound: () => set(s => ({ soundEnabled: !s.soundEnabled })),
      toggleVibration: () => set(s => ({ vibrationEnabled: !s.vibrationEnabled })),
      reset: () => set(defaults),
    }),
    {
      name: 'personal-os-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);