// src/store/useProjectStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  startDate: string;
  deadlineDate: string;
  subtasks: Subtask[];
  notificationIds?: string[];   // ← Add this
}

interface ProjectState {
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (id: string, updatedProject: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleSubtask: (projectId: string, subtaskId: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: [
        {
          id: '1',
          title: 'Personal OS',
          description: 'Build my ultimate productivity app.',
          tags: ['react-native', 'expo', 'typescript'],
          category: 'Development',
          startDate: '2026-10-01',
          deadlineDate: '2026-10-25',
          subtasks: [
            { id: 's1', title: 'Design UI', completed: true },
            { id: 's2', title: 'Setup Navigation', completed: true },
            { id: 's3', title: 'Implement Offline Storage', completed: true },
            { id: 's4', title: 'Add Notifications', completed: false },
            { id: 's5', title: 'Build APK', completed: false },
          ],
        },
      ],
      addProject: (project) => set((state) => ({ projects: [project, ...state.projects] })),
      updateProject: (id, updatedProject) => set((state) => ({
        projects: state.projects.map(p => p.id === id ? { ...p, ...updatedProject } : p)
      })),
      deleteProject: (id) => set((state) => ({ projects: state.projects.filter(p => p.id !== id) })),
      toggleSubtask: (projectId, subtaskId) => set((state) => ({
        projects: state.projects.map(p => {
          if (p.id === projectId) {
            return {
              ...p,
              subtasks: p.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s)
            };
          }
          return p;
        })
      })),
    }),
    { name: 'personal-os-projects', storage: createJSONStorage(() => AsyncStorage) }
  )
);