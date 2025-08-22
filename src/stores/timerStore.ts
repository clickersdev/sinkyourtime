import { create } from 'zustand';
import type { TimerState, Project, Category, TimerSession } from '../types';
import { sessionService } from '../services/database';

interface TimerStore extends TimerState {
  // Actions
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setMode: (mode: 'work' | 'short_break' | 'long_break') => void;
  setProject: (project: Project) => void;
  setCategory: (category: Category) => void;
  tick: () => void;
  completeSession: () => void;
  updateTimeLeft: (time: number) => void;
  updateTotalTime: (time: number) => void;
  incrementPomodoros: () => void;
  resetPomodoros: () => void;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  // Initial state
  isRunning: false,
  currentMode: 'work',
  timeLeft: 25 * 60, // 25 minutes in seconds
  totalTime: 25 * 60,
  completedPomodoros: 0,
  sessionStartTime: undefined,

  // Actions
  startTimer: () => {
    const state = get();
    if (!state.isRunning) {
      set({
        isRunning: true,
        sessionStartTime: new Date()
      });
    }
  },

  pauseTimer: () => {
    set({ isRunning: false });
  },

  resetTimer: () => {
    const state = get();
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    
    let duration = 25 * 60; // Default 25 minutes
    if (state.currentMode === 'work') {
      duration = (settings.workDuration || 25) * 60;
    } else if (state.currentMode === 'short_break') {
      duration = (settings.shortBreakDuration || 5) * 60;
    } else if (state.currentMode === 'long_break') {
      duration = (settings.longBreakDuration || 15) * 60;
    }

    set({
      isRunning: false,
      timeLeft: duration,
      totalTime: duration,
      sessionStartTime: undefined
    });
  },

  setMode: (mode) => {
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    
    let duration = 25 * 60;
    if (mode === 'work') {
      duration = (settings.workDuration || 25) * 60;
    } else if (mode === 'short_break') {
      duration = (settings.shortBreakDuration || 5) * 60;
    } else if (mode === 'long_break') {
      duration = (settings.longBreakDuration || 15) * 60;
    }

    set({
      currentMode: mode,
      timeLeft: duration,
      totalTime: duration,
      isRunning: false,
      sessionStartTime: undefined
    });
  },

  setProject: (project) => {
    set({ currentProject: project });
  },

  setCategory: (category) => {
    set({ currentCategory: category });
  },

  tick: () => {
    const state = get();
    if (state.isRunning && state.timeLeft > 0) {
      set({ timeLeft: state.timeLeft - 1 });
    }
  },

  completeSession: async () => {
    const state = get();
    if (state.currentProject && state.currentCategory && state.sessionStartTime) {
      const session: Omit<TimerSession, 'id'> = {
        projectId: state.currentProject.id,
        categoryId: state.currentCategory.id,
        type: state.currentMode,
        plannedDuration: state.totalTime * 1000, // Convert to milliseconds
        actualDuration: (state.totalTime - state.timeLeft) * 1000,
        startTime: state.sessionStartTime,
        endTime: new Date(),
        completed: state.timeLeft === 0
      };

      try {
        await sessionService.create(session);
      } catch (error) {
        console.error('Error saving session:', error);
      }
    }

    set({
      isRunning: false,
      sessionStartTime: undefined
    });
  },

  updateTimeLeft: (time) => {
    set({ timeLeft: time });
  },

  updateTotalTime: (time) => {
    set({ totalTime: time });
  },

  incrementPomodoros: () => {
    const state = get();
    set({ completedPomodoros: state.completedPomodoros + 1 });
  },

  resetPomodoros: () => {
    set({ completedPomodoros: 0 });
  }
}));
