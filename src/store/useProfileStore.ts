// src/store/useProfileStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProfileState {
  name: string;
  email: string;
  bio: string;
  avatarColor: string;   // ← New
  avatarEmoji: string;   // ← New
  joinedAt: string;      // ← New (ISO date)
  updateProfile: (data: Partial<Omit<ProfileState, 'updateProfile'>>) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      name: 'Zrox',
      email: 'zrox@example.com',
      bio: 'Building my Personal OS.',
      avatarColor: '#2E4A35',
      avatarEmoji: '🚀',
      joinedAt: new Date().toISOString(),
      updateProfile: (data) => set((state) => ({ ...state, ...data })),
    }),
    {
      name: 'personal-os-profile',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);