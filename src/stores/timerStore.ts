import { create } from "zustand";
import type { TimerState, Project, Category, TimerSession } from "../types";
import { sessionService } from "../services/database";
import {
  validateSessionData,
  logSessionData,
  secondsToMilliseconds,
} from "../utils/performance";

interface TimerStore extends TimerState {
  // Actions
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setMode: (mode: "work" | "short_break" | "long_break") => void;
  setProject: (project: Project) => void;
  setCategory: (category: Category) => void;
  tick: () => void;
  completeSession: () => void;
  saveCurrentSession: () => Promise<void>; // New: manually save current session
  updateTimeLeft: (time: number) => void;
  updateTotalTime: (time: number) => void;
  incrementPomodoros: () => void;
  resetPomodoros: () => void;
  clearCurrentSession: () => void; // New: clear current session data
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  // Initial state
  isRunning: false,
  currentMode: "work",
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
        sessionStartTime: state.sessionStartTime || new Date(), // Preserve existing start time if resuming
      });
    }
  },

  pauseTimer: () => {
    set({ isRunning: false });
  },

  resetTimer: () => {
    const state = get();
    const settings = JSON.parse(localStorage.getItem("userSettings") || "{}");

    let duration = 25 * 60; // Default 25 minutes
    if (state.currentMode === "work") {
      duration = (settings.workDuration || 25) * 60;
    } else if (state.currentMode === "short_break") {
      duration = (settings.shortBreakDuration || 5) * 60;
    } else if (state.currentMode === "long_break") {
      duration = (settings.longBreakDuration || 15) * 60;
    }

    set({
      isRunning: false,
      timeLeft: duration,
      totalTime: duration,
      sessionStartTime: undefined, // Clear session start time on reset
    });
  },

  setMode: (mode) => {
    const settings = JSON.parse(localStorage.getItem("userSettings") || "{}");

    let duration = 25 * 60;
    if (mode === "work") {
      duration = (settings.workDuration || 25) * 60;
    } else if (mode === "short_break") {
      duration = (settings.shortBreakDuration || 5) * 60;
    } else if (mode === "long_break") {
      duration = (settings.longBreakDuration || 15) * 60;
    }

    set({
      currentMode: mode,
      timeLeft: duration,
      totalTime: duration,
      isRunning: false,
      sessionStartTime: undefined, // Clear session start time when changing modes
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
    console.log("Complete session called with state:", {
      currentProject: state.currentProject,
      currentCategory: state.currentCategory,
      sessionStartTime: state.sessionStartTime,
      currentMode: state.currentMode,
      totalTime: state.totalTime,
      timeLeft: state.timeLeft,
    });

    if (
      state.currentProject &&
      state.currentCategory &&
      state.sessionStartTime
    ) {
      const session: Omit<TimerSession, "id"> = {
        projectId: state.currentProject.id,
        categoryId: state.currentCategory.id,
        type: state.currentMode,
        plannedDuration: secondsToMilliseconds(state.totalTime),
        actualDuration: secondsToMilliseconds(state.totalTime - state.timeLeft),
        startTime: state.sessionStartTime,
        endTime: new Date(),
        completed: state.timeLeft === 0,
      };

      // Validate session data before saving
      const validation = validateSessionData(session);
      if (!validation.isValid) {
        console.error("Session validation failed:", validation.errors);
        return;
      }

      logSessionData(session, "Completing Session");

      try {
        const savedSession = await sessionService.create(session);
        console.log("Session saved successfully:", savedSession);
      } catch (error) {
        console.error("Error saving session:", error);
      }
    } else {
      console.warn("Cannot save session - missing required data:", {
        hasProject: !!state.currentProject,
        hasCategory: !!state.currentCategory,
        hasStartTime: !!state.sessionStartTime,
      });
    }

    set({
      isRunning: false,
      sessionStartTime: undefined,
    });
  },

  // New: Manually save current session (for when user wants to save progress)
  saveCurrentSession: async () => {
    const state = get();

    if (!state.sessionStartTime) {
      console.warn("No active session to save");
      throw new Error("No active session to save");
    }

    if (!state.currentProject || !state.currentCategory) {
      console.warn("Cannot save session - missing project or category");
      throw new Error("Please select a project and category before saving");
    }

    const session: Omit<TimerSession, "id"> = {
      projectId: state.currentProject.id,
      categoryId: state.currentCategory.id,
      type: state.currentMode,
      plannedDuration: secondsToMilliseconds(state.totalTime),
      actualDuration: secondsToMilliseconds(state.totalTime - state.timeLeft),
      startTime: state.sessionStartTime,
      endTime: new Date(),
      completed: state.timeLeft === 0,
    };

    // Validate session data before saving
    const validation = validateSessionData(session);
    if (!validation.isValid) {
      console.error("Session validation failed:", validation.errors);
      throw new Error(
        `Session validation failed: ${validation.errors.join(", ")}`
      );
    }

    logSessionData(session, "Manually Saving Session");

    try {
      const savedSession = await sessionService.create(session);
      console.log("Session saved successfully:", savedSession);

      // Clear the current session after saving
      set({
        sessionStartTime: undefined,
        isRunning: false,
      });
    } catch (error) {
      console.error("Error saving session:", error);
      throw error;
    }
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
  },

  // New: Clear current session data
  clearCurrentSession: () => {
    set({
      sessionStartTime: undefined,
      isRunning: false,
    });
  },
}));
