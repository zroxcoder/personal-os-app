// src/store/usePasswordStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PasswordCategory = 'Social' | 'Work' | 'Finance' | 'Email' | 'Other';

export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  website?: string;
  notes?: string;
  category: PasswordCategory;
  createdAt: number;
  updatedAt?: number;
}

interface PasswordState {
  passwords: PasswordEntry[];
  addPassword: (entry: PasswordEntry) => void;
  updatePassword: (id: string, updated: Partial<PasswordEntry>) => void;
  deletePassword: (id: string) => void;
}

export const usePasswordStore = create<PasswordState>()(
  persist(
    (set) => ({
      passwords: [],
      addPassword: (entry) => set((state) => ({ passwords: [entry, ...state.passwords] })),
      updatePassword: (id, updated) => set((state) => ({
        passwords: state.passwords.map(p => p.id === id
          ? { ...p, ...updated, updatedAt: Date.now() }
          : p
        ),
      })),
      deletePassword: (id) => set((state) => ({
        passwords: state.passwords.filter(p => p.id !== id),
      })),
    }),
    {
      name: 'personal-os-passwords',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);