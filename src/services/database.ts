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
      console.log("Default settings initialized");
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
      console.log("Default project created");

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
      console.log("Default categories created");

      // Update project with categories
      const categories = await db.categories
        .where("projectId")
        .equals(defaultProject.id)
        .toArray();
      await db.projects.update(defaultProject.id, { categories });
      console.log("Database initialization completed");
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
      console.log("Project created:", newProject.id);
      return newProject;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Project>): Promise<void> {
    try {
      await db.projects.update(id, { ...updates, updatedAt: new Date() });
      console.log("Project updated:", id);
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await db.projects.delete(id);
      await db.categories.where("projectId").equals(id).delete();
      await db.timerSessions.where("projectId").equals(id).delete();
      console.log("Project deleted:", id);
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  },
};

// Category operations
export const categoryService = {
  async getByProjectId(projectId: string): Promise<Category[]> {
    try {
      return await db.categories.where("projectId").equals(projectId).toArray();
    } catch (error) {
      console.error("Error getting categories by project id:", error);
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
      console.log("Category created:", newCategory.id);
      return newCategory;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Category>): Promise<void> {
    try {
      await db.categories.update(id, updates);
      console.log("Category updated:", id);
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await db.categories.delete(id);
      console.log("Category deleted:", id);
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  },
};

// Timer session operations
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
      return await db.timerSessions
        .where("startTime")
        .between(startDate, endDate)
        .toArray();
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
      console.log("Session created:", newSession.id);
      return newSession;
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<TimerSession>): Promise<void> {
    try {
      await db.timerSessions.update(id, updates);
      console.log("Session updated:", id);
    } catch (error) {
      console.error("Error updating session:", error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await db.timerSessions.delete(id);
      console.log("Session deleted:", id);
    } catch (error) {
      console.error("Error deleting session:", error);
      throw error;
    }
  },

  // New: Get sessions by project
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

  // New: Get sessions by category
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
      if (!settings) {
        // If no settings exist, create default ones
        await db.userSettings.add({
          id: "default",
          ...DEFAULT_SETTINGS,
        });
        return DEFAULT_SETTINGS;
      }
      return settings;
    } catch (error) {
      console.error("Error getting settings:", error);
      throw error;
    }
  },

  async update(updates: Partial<UserSettings>): Promise<void> {
    try {
      await db.userSettings.update("default", updates);
      console.log("Settings updated");
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  },
};
