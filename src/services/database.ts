import Dexie, { type Table } from 'dexie';
import type { Project, Category, TimerSession, UserSettings } from '../types';

export class SinkYourTimeDB extends Dexie {
  projects!: Table<Project>;
  categories!: Table<Category>;
  timerSessions!: Table<TimerSession>;
  userSettings!: Table<UserSettings & { id: string }>;

  constructor() {
    super('SinkYourTimeDB');
    
    this.version(1).stores({
      projects: 'id, name, status, createdAt',
      categories: 'id, projectId, name',
      timerSessions: 'id, projectId, categoryId, type, startTime, completed',
      userSettings: 'id'
    });
  }
}

export const db = new SinkYourTimeDB();

// Default categories as specified in PRD
const DEFAULT_CATEGORIES = [
  'Development',
  'Marketing',
  'Design',
  'Planning',
  'Meetings',
  'Research',
  'Administration'
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
  theme: 'system'
};

// Initialize database with default data
export async function initializeDatabase() {
  try {
    // Check if settings exist
    const settings = await db.userSettings.toArray();
    if (settings.length === 0) {
      await db.userSettings.add({
        id: 'default',
        ...DEFAULT_SETTINGS
      });
    }

    // Check if any projects exist
    const projects = await db.projects.toArray();
    if (projects.length === 0) {
      // Create a default project
      const defaultProject: Project = {
        id: crypto.randomUUID(),
        name: 'Default Project',
        description: 'Your first project',
        color: '#3b82f6',
        status: 'active',
        categories: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.projects.add(defaultProject);

      // Add default categories to the default project
      const categoryPromises = DEFAULT_CATEGORIES.map(categoryName => {
        const category: Category = {
          id: crypto.randomUUID(),
          name: categoryName,
          projectId: defaultProject.id
        };
        return db.categories.add(category);
      });

      await Promise.all(categoryPromises);

      // Update project with categories
      const categories = await db.categories.where('projectId').equals(defaultProject.id).toArray();
      await db.projects.update(defaultProject.id, { categories });
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Project operations
export const projectService = {
  async getAll(): Promise<Project[]> {
    const projects = await db.projects.toArray();
    return Promise.all(
      projects.map(async (project) => {
        const categories = await db.categories.where('projectId').equals(project.id).toArray();
        return { ...project, categories };
      })
    );
  },

  async getById(id: string): Promise<Project | undefined> {
    const project = await db.projects.get(id);
    if (project) {
      const categories = await db.categories.where('projectId').equals(id).toArray();
      return { ...project, categories };
    }
    return undefined;
  },

  async create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const newProject: Project = {
      ...project,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.projects.add(newProject);
    return newProject;
  },

  async update(id: string, updates: Partial<Project>): Promise<void> {
    await db.projects.update(id, { ...updates, updatedAt: new Date() });
  },

  async delete(id: string): Promise<void> {
    await db.projects.delete(id);
    await db.categories.where('projectId').equals(id).delete();
    await db.timerSessions.where('projectId').equals(id).delete();
  }
};

// Category operations
export const categoryService = {
  async getByProjectId(projectId: string): Promise<Category[]> {
    return db.categories.where('projectId').equals(projectId).toArray();
  },

  async create(category: Omit<Category, 'id'>): Promise<Category> {
    const newCategory: Category = {
      ...category,
      id: crypto.randomUUID()
    };
    await db.categories.add(newCategory);
    return newCategory;
  },

  async update(id: string, updates: Partial<Category>): Promise<void> {
    await db.categories.update(id, updates);
  },

  async delete(id: string): Promise<void> {
    await db.categories.delete(id);
  }
};

// Timer session operations
export const sessionService = {
  async getAll(): Promise<TimerSession[]> {
    return db.timerSessions.orderBy('startTime').reverse().toArray();
  },

  async getByDateRange(startDate: Date, endDate: Date): Promise<TimerSession[]> {
    return db.timerSessions
      .where('startTime')
      .between(startDate, endDate)
      .toArray();
  },

  async create(session: Omit<TimerSession, 'id'>): Promise<TimerSession> {
    const newSession: TimerSession = {
      ...session,
      id: crypto.randomUUID()
    };
    await db.timerSessions.add(newSession);
    return newSession;
  },

  async update(id: string, updates: Partial<TimerSession>): Promise<void> {
    await db.timerSessions.update(id, updates);
  },

  async delete(id: string): Promise<void> {
    await db.timerSessions.delete(id);
  }
};

// Settings operations
export const settingsService = {
  async get(): Promise<UserSettings> {
    const settings = await db.userSettings.get('default');
    return settings || DEFAULT_SETTINGS;
  },

  async update(updates: Partial<UserSettings>): Promise<void> {
    await db.userSettings.update('default', updates);
  }
};
