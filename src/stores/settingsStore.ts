import { create } from 'zustand';
import type { UserSettings } from '../types';
import { settingsService } from '../services/database';

interface SettingsStore {
  settings: UserSettings;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  clearError: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  audioEnabled: true,
  notificationsEnabled: true,
  autoStartBreaks: false,
  theme: 'system'
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await settingsService.get();
      set({ settings, isLoading: false });
      
      // Apply theme
      applyTheme(settings.theme);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load settings',
        isLoading: false 
      });
    }
  },

  updateSettings: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      await settingsService.update(updates);
      const state = get();
      const newSettings = { ...state.settings, ...updates };
      set({ settings: newSettings, isLoading: false });
      
      // Apply theme if it was updated
      if (updates.theme) {
        applyTheme(updates.theme);
      }
      
      // Save to localStorage for immediate access
      localStorage.setItem('userSettings', JSON.stringify(newSettings));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update settings',
        isLoading: false 
      });
    }
  },

  resetSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      await settingsService.update(DEFAULT_SETTINGS);
      set({ settings: DEFAULT_SETTINGS, isLoading: false });
      
      // Apply default theme
      applyTheme(DEFAULT_SETTINGS.theme);
      
      // Update localStorage
      localStorage.setItem('userSettings', JSON.stringify(DEFAULT_SETTINGS));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to reset settings',
        isLoading: false 
      });
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));

// Helper function to apply theme
function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement;
  
  if (theme === 'system') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const isDark = mediaQuery.matches;
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Listen for changes
    mediaQuery.addEventListener('change', (e) => {
      if (e.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    });
  } else if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
