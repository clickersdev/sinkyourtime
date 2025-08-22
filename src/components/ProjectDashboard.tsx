import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import {
  Plus,
  Clock,
  BarChart3,
  Target,
  TrendingUp,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useProjectStore } from "../stores/projectStore";
import { sessionService } from "../services/database";
import {
  staggerFadeIn,
  scaleIn,
  fadeIn,
  fadeOut,
  slideInFromLeft,
  staggerContentIn,
} from "../utils/animations";
import Modal from "./Modal";
import toast from "react-hot-toast";

const ProjectDashboard: React.FC = () => {
  const { projects, createProject, deleteProject } = useProjectStore();
  const [projectStats, setProjectStats] = useState<
    Record<
      string,
      {
        totalTime: number;
        sessions: number;
        lastActivity?: Date;
      }
    >
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{
    project: any;
    stats: any;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
  });

  // GSAP refs
  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const projectsGridRef = useRef<HTMLDivElement>(null);
  const projectCardsRef = useRef<HTMLDivElement[]>([]);

  // Define activeProjects early to avoid reference errors
  const activeProjects = projects.filter((p) => p.status === "active");

  useEffect(() => {
    loadProjectStats();
  }, [projects]);

  // Initialize animations on mount
  useEffect(() => {
    if (headerRef.current) {
      slideInFromLeft(headerRef.current);
    }
    if (statsRef.current) {
      fadeIn(statsRef.current, 0.2);
    }
    if (projectsGridRef.current) {
      fadeIn(projectsGridRef.current, 0.4);
    }
  }, []);

  // Animate project cards when they load
  useEffect(() => {
    if (projectCardsRef.current.length > 0) {
      staggerFadeIn(projectCardsRef.current, 0.1);
    }
  }, [activeProjects]);

  const loadProjectStats = async () => {
    try {
      const allSessions = await sessionService.getAll();
      const stats: Record<
        string,
        {
          totalTime: number;
          sessions: number;
          lastActivity?: Date;
        }
      > = {};

      projects.forEach((project) => {
        const projectSessions = allSessions.filter(
          (s) => s.projectId === project.id
        );
        const totalTime =
          projectSessions.reduce(
            (sum, session) => sum + session.actualDuration,
            0
          ) /
          (1000 * 60); // Convert to minutes
        const lastActivity =
          projectSessions.length > 0
            ? new Date(
                Math.max(
                  ...projectSessions.map((s) => new Date(s.startTime).getTime())
                )
              )
            : undefined;

        stats[project.id] = {
          totalTime: Math.round(totalTime),
          sessions: projectSessions.length,
          lastActivity,
        };
      });

      setProjectStats(stats);
    } catch (error) {
      console.error("Error loading project stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced project creation animation
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProject({
        name: newProject.name.trim(),
        description: newProject.description.trim(),
        color: newProject.color,
        status: "active",
        categories: [],
      });

      // Animate the new project card in
      const newCard =
        projectCardsRef.current[projectCardsRef.current.length - 1];
      if (newCard) {
        scaleIn(newCard);
      }

      setNewProject({ name: "", description: "", color: "#3b82f6" });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, project: any) => {
    e.preventDefault();
    e.stopPropagation();

    const stats = projectStats[project.id] || { totalTime: 0, sessions: 0 };
    setProjectToDelete({ project, stats });
    setShowDeleteModal(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      // Find the project card element
      const projectIndex = activeProjects.findIndex(
        (p) => p.id === projectToDelete.project.id
      );
      const projectCard = projectCardsRef.current[projectIndex];

      if (projectCard) {
        // Animate out the card
        await fadeOut(projectCard);
      }

      await deleteProject(projectToDelete.project.id);
      toast.success(
        `Project "${projectToDelete.project.name}" deleted successfully`
      );
      setShowDeleteModal(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteProject = () => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
  };

  // Enhanced modal animations
  const openCreateForm = () => {
    setShowCreateForm(true);
  };

  const closeCreateForm = () => {
    setShowCreateForm(false);
  };

  // Handle keyboard events for delete modal
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showDeleteModal && e.key === "Escape") {
        cancelDeleteProject();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [showDeleteModal]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatLastActivity = (date?: Date) => {
    if (!date) return "No activity";
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with enhanced animations */}
      <div ref={headerRef} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            Manage your projects and track your productivity
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>New Project</span>
        </button>
      </div>

      {/* Stats Overview with enhanced animations */}
      <div
        ref={statsRef}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
      >
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeProjects.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(
                  Object.values(projectStats).reduce(
                    (sum, stat) => sum + stat.totalTime,
                    0
                  )
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(projectStats).reduce(
                  (sum, stat) => sum + stat.sessions,
                  0
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Avg Session</p>
              <p className="text-2xl font-bold text-gray-900">
                {(() => {
                  const totalSessions = Object.values(projectStats).reduce(
                    (sum, stat) => sum + stat.sessions,
                    0
                  );
                  const totalTime = Object.values(projectStats).reduce(
                    (sum, stat) => sum + stat.totalTime,
                    0
                  );
                  return totalSessions > 0
                    ? Math.round(totalTime / totalSessions) + "m"
                    : "0m";
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid with staggered animations */}
      {activeProjects.length === 0 ? (
        <div
          className="text-center py-12"
          ref={(el) => {
            if (el) fadeIn(el, 0.6);
          }}
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No projects yet
          </h3>
          <p className="text-gray-500 mb-6">
            Create your first project to start tracking your time
          </p>
          <button onClick={openCreateForm} className="btn btn-primary">
            Create Your First Project
          </button>
        </div>
      ) : (
        <div
          ref={projectsGridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {activeProjects.map((project, index) => {
            const stats = projectStats[project.id] || {
              totalTime: 0,
              sessions: 0,
            };
            return (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="card hover:shadow-md transition-shadow cursor-pointer group"
                ref={(el) => {
                  if (el) projectCardsRef.current[index] = el;
                }}
              >
                {/* Project Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteProject(e, project)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Project"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Project Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Time</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatTime(stats.totalTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sessions</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {stats.sessions}
                    </p>
                  </div>
                </div>

                {/* Last Activity */}
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Last Activity</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatLastActivity(stats.lastActivity)}
                  </p>
                </div>

                {/* Click indicator */}
                <div className="text-sm text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to open project →
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={closeCreateForm}
        title="Create New Project"
      >
        <form onSubmit={handleCreateProject}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                value={newProject.name}
                onChange={(e) =>
                  setNewProject({ ...newProject, name: e.target.value })
                }
                className="input"
                placeholder="Enter project name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({
                    ...newProject,
                    description: e.target.value,
                  })
                }
                className="input"
                rows={3}
                placeholder="Enter project description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="color"
                value={newProject.color}
                onChange={(e) =>
                  setNewProject({ ...newProject, color: e.target.value })
                }
                className="w-full h-10 rounded-lg border border-gray-300"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => {
                closeCreateForm();
                setNewProject({
                  name: "",
                  description: "",
                  color: "#3b82f6",
                });
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal && !!projectToDelete}
        onClose={cancelDeleteProject}
        title=""
        className="max-w-md"
      >
        <div className="flex items-center mb-4 text-red-600">
          <AlertTriangle size={24} />
          <h3 className="ml-2 text-lg font-medium">Confirm Deletion</h3>
        </div>
        <p className="text-gray-800 mb-4">
          Are you sure you want to delete the project "
          {projectToDelete?.project.name}"? This action cannot be undone.
        </p>
        {projectToDelete?.stats.sessions &&
          projectToDelete.stats.sessions > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center text-red-800 mb-2">
                <AlertTriangle size={16} className="mr-2" />
                <span className="font-medium">Data will be lost:</span>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                <li>
                  • {projectToDelete.stats.sessions} work session
                  {projectToDelete.stats.sessions !== 1 ? "s" : ""}
                </li>
                <li>
                  • {formatTime(projectToDelete.stats.totalTime)} of tracked
                  time
                </li>
                <li>• All project categories and settings</li>
              </ul>
            </div>
          )}
        <div className="flex justify-end space-x-3">
          <button
            onClick={cancelDeleteProject}
            className="btn btn-secondary"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={confirmDeleteProject}
            className="btn btn-danger"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectDashboard;
