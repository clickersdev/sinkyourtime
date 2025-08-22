import { create } from 'zustand';
import type { Project, Category } from '../types';
import { projectService, categoryService } from '../services/database';

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  currentCategory: Category | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadProjects: () => Promise<void>;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  setCurrentCategory: (category: Category | null) => void;
  createCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProject: null,
  currentCategory: null,
  isLoading: false,
  error: null,

  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await projectService.getAll();
      set({ projects, isLoading: false });
      
      // Set first active project as current if none selected
      const state = get();
      if (!state.currentProject && projects.length > 0) {
        const activeProject = projects.find(p => p.status === 'active');
        if (activeProject) {
          set({ currentProject: activeProject });
        }
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load projects',
        isLoading: false 
      });
    }
  },

  createProject: async (projectData) => {
    set({ isLoading: true, error: null });
    try {
      const newProject = await projectService.create(projectData);
      const state = get();
      set({ 
        projects: [...state.projects, newProject],
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create project',
        isLoading: false 
      });
    }
  },

  updateProject: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.update(id, updates);
      const state = get();
      const updatedProjects = state.projects.map(project =>
        project.id === id ? { ...project, ...updates } : project
      );
      set({ projects: updatedProjects, isLoading: false });
      
      // Update current project if it was the one updated
      if (state.currentProject?.id === id) {
        const updatedProject = updatedProjects.find(p => p.id === id);
        if (updatedProject) {
          set({ currentProject: updatedProject });
        }
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update project',
        isLoading: false 
      });
    }
  },

  deleteProject: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.delete(id);
      const state = get();
      const filteredProjects = state.projects.filter(project => project.id !== id);
      set({ projects: filteredProjects, isLoading: false });
      
      // Clear current project if it was deleted
      if (state.currentProject?.id === id) {
        set({ currentProject: null, currentCategory: null });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete project',
        isLoading: false 
      });
    }
  },

  setCurrentProject: (project) => {
    set({ currentProject: project, currentCategory: null });
  },

  setCurrentCategory: (category) => {
    set({ currentCategory: category });
  },

  createCategory: async (categoryData) => {
    set({ isLoading: true, error: null });
    try {
      const newCategory = await categoryService.create(categoryData);
      const state = get();
      
      // Update the project with the new category
      const updatedProjects = state.projects.map(project => {
        if (project.id === categoryData.projectId) {
          return {
            ...project,
            categories: [...project.categories, newCategory]
          };
        }
        return project;
      });
      
      set({ projects: updatedProjects, isLoading: false });
      
      // Update current project if it was the one updated
      if (state.currentProject?.id === categoryData.projectId) {
        const updatedProject = updatedProjects.find(p => p.id === categoryData.projectId);
        if (updatedProject) {
          set({ currentProject: updatedProject });
        }
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create category',
        isLoading: false 
      });
    }
  },

  updateCategory: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await categoryService.update(id, updates);
      const state = get();
      
      // Update the category in all projects
      const updatedProjects = state.projects.map(project => ({
        ...project,
        categories: project.categories.map(category =>
          category.id === id ? { ...category, ...updates } : category
        )
      }));
      
      set({ projects: updatedProjects, isLoading: false });
      
      // Update current project and category if needed
      if (state.currentProject) {
        const updatedProject = updatedProjects.find(p => p.id === state.currentProject!.id);
        if (updatedProject) {
          set({ currentProject: updatedProject });
        }
      }
      
      if (state.currentCategory?.id === id) {
        const updatedCategory = updatedProjects
          .flatMap(p => p.categories)
          .find(c => c.id === id);
        if (updatedCategory) {
          set({ currentCategory: updatedCategory });
        }
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update category',
        isLoading: false 
      });
    }
  },

  deleteCategory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await categoryService.delete(id);
      const state = get();
      
      // Remove the category from all projects
      const updatedProjects = state.projects.map(project => ({
        ...project,
        categories: project.categories.filter(category => category.id !== id)
      }));
      
      set({ projects: updatedProjects, isLoading: false });
      
      // Update current project if needed
      if (state.currentProject) {
        const updatedProject = updatedProjects.find(p => p.id === state.currentProject!.id);
        if (updatedProject) {
          set({ currentProject: updatedProject });
        }
      }
      
      // Clear current category if it was deleted
      if (state.currentCategory?.id === id) {
        set({ currentCategory: null });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete category',
        isLoading: false 
      });
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));
