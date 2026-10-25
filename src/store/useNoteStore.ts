// src/store/useNoteStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string; // Changed from union to string for custom categories
  color: string;    // Hex color code
  isPinned: boolean;
  tags: string[];
  date: string;
  createdAt: number; // For sorting
}

interface NoteState {
  notes: Note[];
  categories: string[]; // Dynamic categories
  addNote: (note: Note) => void;
  updateNote: (id: string, updatedNote: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePin: (id: string) => void;
  addCategory: (category: string) => void;
}

const DEFAULT_CATEGORIES = ['General', 'Study', 'Work', 'Personal', 'Ideas'];

export const useNoteStore = create<NoteState>()(
  persist(
    (set) => ({
      categories: DEFAULT_CATEGORIES,
      notes: [
        {
          id: '1',
          title: 'Network Concepts',
          content: 'OSI model, TCP/IP, Subnetting...',
          category: 'Study',
          color: '#FFFFFF', // Default white/glass
          isPinned: true,
          tags: ['networking', 'ccna'],
          date: 'Oct 19, 2026',
          createdAt: Date.now() - 100000,
        },
        {
          id: '2',
          title: 'Project Ideas',
          content: 'Personal OS features...',
          category: 'Ideas',
          color: '#E3F2FD', // Soft Blue
          isPinned: false,
          tags: ['app', 'react-native'],
          date: 'Oct 17, 2026',
          createdAt: Date.now() - 200000,
        }
      ],
      addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
      updateNote: (id, updatedNote) => set((state) => ({
        notes: state.notes.map(n => n.id === id ? { ...n, ...updatedNote } : n)
      })),
      deleteNote: (id) => set((state) => ({ notes: state.notes.filter(n => n.id !== id) })),
      togglePin: (id) => set((state) => ({
        notes: state.notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n)
      })),
      addCategory: (category) => set((state) => {
        if (!state.categories.includes(category)) {
          return { categories: [...state.categories, category] };
        }
        return state;
      }),
    }),
    {
      name: 'personal-os-notes',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);