// src/store/useTaskStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Task {
  id: string;
  title: string;
  time: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  date: string; 
  notificationId?: string | null; // <-- Added
}

interface TaskState {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updatedTask: Partial<Task>) => void; // <-- Added
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
      updateTask: (id, updatedTask) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updatedTask } : t)
      })),
      toggleTask: (id) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      })),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
      })),
    }),
    {
      name: 'personal-os-tasks',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);