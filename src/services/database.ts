import Dexie, { type Table } from "dexie";
import type { Project, Category, TimerSession, UserSettings } from "../types";

export class SinkYourTimeDB extends Dexie {
  projects!: Table<Project>;
  categories!: Table<Category>;
  timerSessions!: Table<TimerSession>;
  userSettings!: Table<UserSettings & { id: string }>;

  constructor() {
    super("SinkYourTimeDB");

    this.version(1).stores({
      projects: "id, name, status, createdAt",
      categories: "id, projectId, name",
      timerSessions: "id, projectId, categoryId, type, startTime, completed",
      userSettings: "id",
    });
  }
}

export const db = new SinkYourTimeDB();

// Default categories as specified in PRD
const DEFAULT_CATEGORIES = [
  "Development",
  "Marketing",
  "Design",
  "Planning",
  "Meetings",
  "Research",
  "Administration",
];

// Default settings
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

// Initialize database with default data
export async function initializeDatabase() {
  try {
    // Check if settings exist
    const settings = await db.userSettings.toArray();
    if (settings.length === 0) {
      await db.userSettings.add({
        id: "default",
        ...DEFAULT_SETTINGS,
      });
    }

    // Check if any projects exist
    const projects = await db.projects.toArray();
    if (projects.length === 0) {
      // Create a default project
      const defaultProject: Project = {
        id: crypto.randomUUID(),
        name: "Default Project",
        description: "Your first project",
        color: "#3b82f6",
        status: "active",
        categories: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.projects.add(defaultProject);

      // Add default categories to the default project
      const categoryPromises = DEFAULT_CATEGORIES.map((categoryName) => {
        const category: Category = {
          id: crypto.randomUUID(),
          name: categoryName,
          projectId: defaultProject.id,
        };
        return db.categories.add(category);
      });

      await Promise.all(categoryPromises);

      // Update project with categories
      const categories = await db.categories
        .where("projectId")
        .equals(defaultProject.id)
        .toArray();
      await db.projects.update(defaultProject.id, { categories });
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

// Project operations
export const projectService = {
  async getAll(): Promise<Project[]> {
    try {
      const projects = await db.projects.toArray();
      return Promise.all(
        projects.map(async (project) => {
          const categories = await db.categories
            .where("projectId")
            .equals(project.id)
            .toArray();
          return { ...project, categories };
        })
      );
    } catch (error) {
      console.error("Error getting all projects:", error);
      throw error;
    }
  },

  async getById(id: string): Promise<Project | undefined> {
    try {
      const project = await db.projects.get(id);
      if (project) {
        const categories = await db.categories
          .where("projectId")
          .equals(id)
          .toArray();
        return { ...project, categories };
      }
      return undefined;
    } catch (error) {
      console.error("Error getting project by id:", error);
      throw error;
    }
  },

  async create(
    project: Omit<Project, "id" | "createdAt" | "updatedAt">
  ): Promise<Project> {
    try {
      const newProject: Project = {
        ...project,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.projects.add(newProject);
      return newProject;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Project>): Promise<void> {
    try {
      await db.projects.update(id, { ...updates, updatedAt: new Date() });
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await db.projects.delete(id);
      // Also delete associated categories and sessions
      await db.categories.where("projectId").equals(id).delete();
      await db.timerSessions.where("projectId").equals(id).delete();
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  },
};

// Category operations
export const categoryService = {
  async getByProject(projectId: string): Promise<Category[]> {
    try {
      return await db.categories.where("projectId").equals(projectId).toArray();
    } catch (error) {
      console.error("Error getting categories by project:", error);
      throw error;
    }
  },

  async create(category: Omit<Category, "id">): Promise<Category> {
    try {
      const newCategory: Category = {
        ...category,
        id: crypto.randomUUID(),
      };
      await db.categories.add(newCategory);
      return newCategory;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Category>): Promise<void> {
    try {
      await db.categories.update(id, updates);
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await db.categories.delete(id);
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  },
};

// Session operations
export const sessionService = {
  async getAll(): Promise<TimerSession[]> {
    try {
      const sessions = await db.timerSessions.toArray();
      return sessions.sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
    } catch (error) {
      console.error("Error getting all sessions:", error);
      throw error;
    }
  },

  async getByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<TimerSession[]> {
    try {
      // Get all sessions and filter manually for better reliability
      const allSessions = await db.timerSessions.toArray();

      const filteredSessions = allSessions.filter((session) => {
        const sessionDate = new Date(session.startTime);
        const isInRange = sessionDate >= startDate && sessionDate <= endDate;

        if (isInRange) {
          // Session is in the specified date range
        }

        return isInRange;
      });

      return filteredSessions.sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
    } catch (error) {
      console.error("Error getting sessions by date range:", error);
      throw error;
    }
  },

  async create(session: Omit<TimerSession, "id">): Promise<TimerSession> {
    try {
      // Validate required fields
      if (!session.projectId || !session.categoryId || !session.startTime) {
        throw new Error(
          "Missing required session fields: projectId, categoryId, or startTime"
        );
      }

      const newSession: TimerSession = {
        ...session,
        id: crypto.randomUUID(),
      };

      await db.timerSessions.add(newSession);
      return newSession;
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<TimerSession>): Promise<void> {
    try {
      await db.timerSessions.update(id, updates);
    } catch (error) {
      console.error("Error updating session:", error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await db.timerSessions.delete(id);
    } catch (error) {
      console.error("Error deleting session:", error);
      throw error;
    }
  },

  // Get sessions by project
  async getByProject(projectId: string): Promise<TimerSession[]> {
    try {
      const sessions = await db.timerSessions
        .where("projectId")
        .equals(projectId)
        .toArray();

      return sessions.sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
    } catch (error) {
      console.error("Error getting sessions by project:", error);
      throw error;
    }
  },

  // Get sessions by category
  async getByCategory(categoryId: string): Promise<TimerSession[]> {
    try {
      const sessions = await db.timerSessions
        .where("categoryId")
        .equals(categoryId)
        .toArray();

      return sessions.sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
    } catch (error) {
      console.error("Error getting sessions by category:", error);
      throw error;
    }
  },
};

// Settings operations
export const settingsService = {
  async get(): Promise<UserSettings> {
    try {
      const settings = await db.userSettings.get("default");
      return settings || DEFAULT_SETTINGS;
    } catch (error) {
      console.error("Error getting settings:", error);
      return DEFAULT_SETTINGS;
    }
  },

  async update(updates: Partial<UserSettings>): Promise<void> {
    try {
      await db.userSettings.update("default", updates);
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  },
};
