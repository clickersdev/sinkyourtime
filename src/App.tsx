import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useParams,
} from "react-router-dom";
import { gsap } from "gsap";
import { Toaster } from "react-hot-toast";
import {
  Clock,
  BarChart3,
  Settings,
  Home,
  ArrowLeft,
  PieChart,
} from "lucide-react";
import Timer from "./components/Timer";
import Analytics from "./components/Analytics";
import SettingsComponent from "./components/Settings";
import ProjectDashboard from "./components/ProjectDashboard";
import ProjectOverview from "./components/ProjectOverview";
import PageTransition from "./components/PageTransition";
import { useProjectStore } from "./stores/projectStore";
import { useSettingsStore } from "./stores/settingsStore";
import { initializeDatabase } from "./services/database";
import { initializeTheme, toggleTheme, getCurrentTheme } from "./utils/theme";

const Navigation: React.FC = () => {
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const { projectId } = useParams();
  const { currentProject } = useProjectStore();

  // Show project navigation when we're on a project page (check URL path)
  const isProjectPage = location.pathname.startsWith("/project/");

  const navItems = isProjectPage
    ? [
        { path: `/project/${projectId}`, label: "Timer", icon: Clock },
        {
          path: `/project/${projectId}/analytics`,
          label: "Analytics",
          icon: BarChart3,
        },
        {
          path: `/project/${projectId}/overview`,
          label: "Overview",
          icon: PieChart,
        },
      ]
    : [{ path: "/", label: "Projects", icon: Home }];

  return (
    <>
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {isProjectPage && (
                <Link
                  to="/"
                  className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mr-4"
                >
                  <ArrowLeft size={20} />
                  <span className="text-sm">Back to Projects</span>
                </Link>
              )}
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Sink Your Time
                </h1>
                {currentProject && isProjectPage && (
                  <div className="ml-4 flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: currentProject.color }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {currentProject.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Theme toggle button for testing */}
              <button
                onClick={() => {
                  console.log("Current theme:", getCurrentTheme());
                  toggleTheme();
                }}
                className="px-3 py-2 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Toggle Theme
              </button>

              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <SettingsComponent
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
};

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams();
  const { projects, currentProject, setCurrentProject } = useProjectStore();

  useEffect(() => {
    if (projectId) {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        setCurrentProject(project);
      }
    }
  }, [projectId, projects, setCurrentProject]);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">
          Project not found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Selector Only */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: currentProject.color }}
              />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {currentProject.name}
              </h2>
            </div>
            {currentProject.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {currentProject.description}
              </p>
            )}
            <CategorySelector />
          </div>
        </div>

        {/* Timer */}
        <div className="lg:col-span-2">
          <Timer />
        </div>
      </div>
    </div>
  );
};

const ProjectAnalyticsPage: React.FC = () => {
  const { projectId } = useParams();
  const { projects, currentProject, setCurrentProject } = useProjectStore();

  useEffect(() => {
    if (projectId) {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        setCurrentProject(project);
      }
    }
  }, [projectId, projects, setCurrentProject]);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">
          Project not found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <div
            className="w-8 h-8 rounded-full"
            style={{ backgroundColor: currentProject.color }}
          />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {currentProject.name} - Analytics
          </h1>
        </div>
        {currentProject.description && (
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {currentProject.description}
          </p>
        )}
      </div>
      <Analytics projectId={projectId} />
    </div>
  );
};

const ProjectOverviewPage: React.FC = () => {
  const { projectId } = useParams();
  const { projects, currentProject, setCurrentProject } = useProjectStore();

  useEffect(() => {
    if (projectId) {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        setCurrentProject(project);
      }
    }
  }, [projectId, projects, setCurrentProject]);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">
          Project not found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProjectOverview projectId={projectId} />
    </div>
  );
};

// Category Selector Component (simplified version of ProjectSelector)
const CategorySelector: React.FC = () => {
  const {
    currentProject,
    currentCategory,
    setCurrentCategory,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useProjectStore();
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "" });

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    try {
      await createCategory({
        name: categoryForm.name.trim(),
        projectId: currentProject.id,
      });
      setCategoryForm({ name: "" });
      setShowCategoryForm(false);
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      await updateCategory(editingCategory.id, {
        name: categoryForm.name.trim(),
      });
      setCategoryForm({ name: "" });
      setEditingCategory(null);
      setShowCategoryForm(false);
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const handleDeleteCategory = async (category: any) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        await deleteCategory(category.id);
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  const openEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name });
    setShowCategoryForm(true);
  };

  if (!currentProject) {
    return <div className="text-gray-500">No project selected</div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Category
        </label>

        <div className="relative">
          <button
            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            <span
              className={
                currentCategory
                  ? "text-gray-900 dark:text-gray-100"
                  : "text-gray-500 dark:text-gray-400"
              }
            >
              {currentCategory ? currentCategory.name : "Select a category"}
            </span>
            <svg
              className="w-5 h-5 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isCategoryDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {currentProject.categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <button
                    onClick={() => {
                      setCurrentCategory(category);
                      setIsCategoryDropdownOpen(false);
                    }}
                    className="flex-1 text-left font-medium text-gray-900 dark:text-gray-100"
                  >
                    {category.name}
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditCategory(category)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                <button
                  onClick={() => {
                    setShowCategoryForm(true);
                    setIsCategoryDropdownOpen(false);
                  }}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span>Create New Category</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              {editingCategory ? "Edit Category" : "Create New Category"}
            </h3>

            <form
              onSubmit={
                editingCategory ? handleUpdateCategory : handleCreateCategory
              }
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ name: e.target.value })}
                  className="input"
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                    setCategoryForm({ name: "" });
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Route transition component
const AnimatedRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PageTransition>
            <ProjectDashboard />
          </PageTransition>
        }
      />
      <Route
        path="/project/:projectId"
        element={
          <PageTransition>
            <ProjectDetailPage />
          </PageTransition>
        }
      />
      <Route
        path="/project/:projectId/analytics"
        element={
          <PageTransition>
            <ProjectAnalyticsPage />
          </PageTransition>
        }
      />
      <Route
        path="/project/:projectId/overview"
        element={
          <PageTransition>
            <ProjectOverviewPage />
          </PageTransition>
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { loadProjects } = useProjectStore();
  const { loadSettings } = useSettingsStore();

  // Initialize theme immediately on app start
  useEffect(() => {
    initializeTheme();
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("Starting app initialization...");

        // Initialize database
        await initializeDatabase();
        console.log("Database initialized successfully");

        // Load initial data
        console.log("Loading projects and settings...");
        await Promise.all([loadProjects(), loadSettings()]);
        console.log("Projects and settings loaded successfully");

        setIsInitialized(true);
        console.log("App initialization completed");
      } catch (error) {
        console.error("Error initializing app:", error);
        setIsInitialized(true); // Still set to true to show the app
      }
    };

    initializeApp();
  }, [loadProjects, loadSettings]);

  // Request notification permission on app start
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div
          className="text-center"
          ref={(el) => {
            if (el) {
              gsap.fromTo(
                el,
                { opacity: 0, scale: 0.9 },
                { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" }
              );
            }
          }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading Sink Your Time...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main>
          <AnimatedRoutes />
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
          }}
        />
      </div>
    </Router>
  );
};

export default App;
