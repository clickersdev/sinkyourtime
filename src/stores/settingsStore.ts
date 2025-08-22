import { create } from "zustand";
import type { UserSettings } from "../types";
import { settingsService } from "../services/database";
import { applyTheme } from "../utils/theme";

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
  theme: "system",
};

// Helper function to get settings from localStorage
const getSettingsFromLocalStorage = (): UserSettings => {
  try {
    const stored = localStorage.getItem("userSettings");
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all required fields exist
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error("Error parsing settings from localStorage:", error);
  }
  return DEFAULT_SETTINGS;
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: getSettingsFromLocalStorage(), // Initialize with localStorage data
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      // First try to load from database
      const dbSettings = await settingsService.get();

      // Merge with localStorage settings (localStorage takes precedence for immediate access)
      const localSettings = getSettingsFromLocalStorage();
      const mergedSettings = { ...dbSettings, ...localSettings };

      set({ settings: mergedSettings, isLoading: false });

      // Apply theme from settings
      applyTheme(mergedSettings.theme);

      // Update localStorage with merged settings
      localStorage.setItem("userSettings", JSON.stringify(mergedSettings));
    } catch (error) {
      console.error("Error loading settings from database:", error);

      // Fallback to localStorage settings
      const localSettings = getSettingsFromLocalStorage();
      set({ settings: localSettings, isLoading: false });

      // Apply theme from localStorage
      applyTheme(localSettings.theme);

      set({
        error: "Failed to load settings from database, using local settings",
        isLoading: false,
      });
    }
  },

  updateSettings: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      // Update database
      await settingsService.update(updates);

      // Update local state
      const state = get();
      const newSettings = { ...state.settings, ...updates };
      set({ settings: newSettings, isLoading: false });

      // Apply theme if it was updated
      if (updates.theme) {
        applyTheme(updates.theme);
      }

      // Save to localStorage for immediate access
      localStorage.setItem("userSettings", JSON.stringify(newSettings));
    } catch (error) {
      console.error("Error updating settings:", error);

      // Still update localStorage even if database fails
      const state = get();
      const newSettings = { ...state.settings, ...updates };
      localStorage.setItem("userSettings", JSON.stringify(newSettings));

      // Apply theme if it was updated
      if (updates.theme) {
        applyTheme(updates.theme);
      }

      set({
        error:
          "Failed to save settings to database, but local changes were applied",
        isLoading: false,
      });
    }
  },

  resetSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      // Reset in database
      await settingsService.update(DEFAULT_SETTINGS);

      // Update local state
      set({ settings: DEFAULT_SETTINGS, isLoading: false });

      // Apply default theme
      applyTheme(DEFAULT_SETTINGS.theme);

      // Update localStorage
      localStorage.setItem("userSettings", JSON.stringify(DEFAULT_SETTINGS));
    } catch (error) {
      console.error("Error resetting settings:", error);

      // Still reset localStorage even if database fails
      set({ settings: DEFAULT_SETTINGS, isLoading: false });
      applyTheme(DEFAULT_SETTINGS.theme);
      localStorage.setItem("userSettings", JSON.stringify(DEFAULT_SETTINGS));

      set({
        error:
          "Failed to reset settings in database, but local settings were reset",
        isLoading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
