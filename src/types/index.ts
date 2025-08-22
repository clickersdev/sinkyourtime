export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  status: "active" | "archived";
  categories: Category[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  projectId: string;
}

export interface TimerSession {
  id: string;
  projectId: string;
  categoryId: string;
  type: "work" | "short_break" | "long_break";
  plannedDuration: number; // milliseconds
  actualDuration: number; // milliseconds
  startTime: Date;
  endTime?: Date;
  completed: boolean;
}

export interface UserSettings {
  workDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  longBreakInterval: number; // after X pomodoros
  audioEnabled: boolean;
  notificationsEnabled: boolean;
  autoStartBreaks: boolean;
  theme: "light" | "dark" | "system";
}

export interface TimerState {
  isRunning: boolean;
  currentMode: "work" | "short_break" | "long_break";
  timeLeft: number; // seconds
  totalTime: number; // seconds
  currentProject?: Project;
  currentCategory?: Category;
  completedPomodoros: number;
  sessionStartTime?: Date;
}

export interface AnalyticsData {
  totalFocusedTime: number; // minutes
  completedPomodoros: number;
  averageSessionLength: number; // minutes
  projectBreakdown: Array<{
    projectId: string;
    projectName: string;
    totalTime: number; // minutes
    sessions: number;
  }>;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    totalTime: number; // minutes
    sessions: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    totalTime: number; // minutes
    sessions: number;
  }>;
}
