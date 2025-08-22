import React, { useState } from "react";
import { ChevronDown, Plus, Edit, Trash2 } from "lucide-react";
import { useProjectStore } from "../stores/projectStore";
import type { Project, Category } from "../types";

const ProjectSelector: React.FC = () => {
  const {
    projects,
    currentProject,
    currentCategory,
    setCurrentProject,
    setCurrentCategory,
    createProject,
    updateProject,
    deleteProject,
    createCategory,
    updateCategory,
    deleteCategory,
    error,
  } = useProjectStore();

  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form states
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name.trim()) return;

    try {
      await createProject({
        name: projectForm.name.trim(),
        description: projectForm.description.trim(),
        color: projectForm.color,
        status: "active",
        categories: [],
      });

      setProjectForm({ name: "", description: "", color: "#3b82f6" });
      setShowProjectForm(false);
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !projectForm.name.trim()) return;

    try {
      await updateProject(editingProject.id, {
        name: projectForm.name.trim(),
        description: projectForm.description.trim(),
        color: projectForm.color,
      });

      setProjectForm({ name: "", description: "", color: "#3b82f6" });
      setEditingProject(null);
      setShowProjectForm(false);
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${project.name}"? This will also delete all associated categories and sessions.`
      )
    ) {
      try {
        await deleteProject(project.id);
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !categoryForm.name.trim()) return;

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
    if (!editingCategory || !categoryForm.name.trim()) return;

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

  const handleDeleteCategory = async (category: Category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        await deleteCategory(category.id);
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  const openEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      description: project.description || "",
      color: project.color,
    });
    setShowProjectForm(true);
    setIsProjectDropdownOpen(false);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name });
    setShowCategoryForm(true);
    setIsCategoryDropdownOpen(false);
  };

  const activeProjects = projects.filter((p) => p.status === "active");

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Project Selector */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project
        </label>

        <div className="relative">
          <button
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <div className="flex items-center space-x-3">
              {currentProject && (
                <>
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: currentProject.color }}
                  />
                  <span className="text-gray-900">{currentProject.name}</span>
                </>
              )}
              {!currentProject && (
                <span className="text-gray-500">Select a project</span>
              )}
            </div>
            <ChevronDown size={20} className="text-gray-400" />
          </button>

          {isProjectDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {activeProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50"
                >
                  <button
                    onClick={() => {
                      setCurrentProject(project);
                      setIsProjectDropdownOpen(false);
                    }}
                    className="flex items-center space-x-3 flex-1 text-left"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {project.name}
                      </div>
                      {project.description && (
                        <div className="text-sm text-gray-500">
                          {project.description}
                        </div>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditProject(project)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="border-t border-gray-200 p-3">
                <button
                  onClick={() => {
                    setShowProjectForm(true);
                    setIsProjectDropdownOpen(false);
                  }}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                >
                  <Plus size={16} />
                  <span>Create New Project</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Selector */}
      {currentProject && (
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>

          <div className="relative">
            <button
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span
                className={currentCategory ? "text-gray-900" : "text-gray-500"}
              >
                {currentCategory ? currentCategory.name : "Select a category"}
              </span>
              <ChevronDown size={20} className="text-gray-400" />
            </button>

            {isCategoryDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {currentProject.categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50"
                  >
                    <button
                      onClick={() => {
                        setCurrentCategory(category);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className="flex-1 text-left font-medium text-gray-900"
                    >
                      {category.name}
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditCategory(category)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="border-t border-gray-200 p-3">
                  <button
                    onClick={() => {
                      setShowCategoryForm(true);
                      setIsCategoryDropdownOpen(false);
                    }}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                  >
                    <Plus size={16} />
                    <span>Create New Category</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Project Form Modal */}
      {showProjectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingProject ? "Edit Project" : "Create New Project"}
            </h3>

            <form
              onSubmit={
                editingProject ? handleUpdateProject : handleCreateProject
              }
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectForm.name}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, name: e.target.value })
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
                    value={projectForm.description}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
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
                    value={projectForm.color}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, color: e.target.value })
                    }
                    className="w-full h-10 rounded-lg border border-gray-300"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowProjectForm(false);
                    setEditingProject(null);
                    setProjectForm({
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
                  {editingProject ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingCategory ? "Edit Category" : "Create New Category"}
            </h3>

            <form
              onSubmit={
                editingCategory ? handleUpdateCategory : handleCreateCategory
              }
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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

export default ProjectSelector;
