import React, { useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import { useSettingsStore } from "../stores/settingsStore";
import Modal from "./Modal";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, resetSettings, isLoading, error } =
    useSettingsStore();

  const [formData, setFormData] = useState({
    workDuration: settings.workDuration,
    shortBreakDuration: settings.shortBreakDuration,
    longBreakDuration: settings.longBreakDuration,
    longBreakInterval: settings.longBreakInterval,
    audioEnabled: settings.audioEnabled,
    notificationsEnabled: settings.notificationsEnabled,
    theme: settings.theme,
  });

  // Update form data when settings change
  React.useEffect(() => {
    setFormData({
      workDuration: settings.workDuration,
      shortBreakDuration: settings.shortBreakDuration,
      longBreakDuration: settings.longBreakDuration,
      longBreakInterval: settings.longBreakInterval,
      audioEnabled: settings.audioEnabled,
      notificationsEnabled: settings.notificationsEnabled,
      theme: settings.theme,
    });
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings(formData);
      onClose();
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const handleReset = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset all settings to default values?"
      )
    ) {
      try {
        await resetSettings();
        setFormData({
          workDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
          longBreakInterval: 4,
          audioEnabled: true,
          notificationsEnabled: true,
          theme: "system",
        });
      } catch (error) {
        console.error("Error resetting settings:", error);
      }
    }
  };

  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      className="max-w-md max-h-[90vh] overflow-y-auto"
    >
      {/* Content */}
      <div className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Timer Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Timer Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Work Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={formData.workDuration}
                onChange={(e) =>
                  handleInputChange("workDuration", parseInt(e.target.value))
                }
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Short Break Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.shortBreakDuration}
                onChange={(e) =>
                  handleInputChange(
                    "shortBreakDuration",
                    parseInt(e.target.value)
                  )
                }
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Long Break Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={formData.longBreakDuration}
                onChange={(e) =>
                  handleInputChange(
                    "longBreakDuration",
                    parseInt(e.target.value)
                  )
                }
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Long Break Interval (pomodoros)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.longBreakInterval}
                onChange={(e) =>
                  handleInputChange(
                    "longBreakInterval",
                    parseInt(e.target.value)
                  )
                }
                className="input"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Take a long break after this many completed work sessions
              </p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Notifications
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sound Notifications
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Play sound when timer completes
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.audioEnabled}
                  onChange={(e) =>
                    handleInputChange("audioEnabled", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Browser Notifications
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Show browser notifications when timer completes
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notificationsEnabled}
                  onChange={(e) =>
                    handleInputChange("notificationsEnabled", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Appearance
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theme
            </label>
            <select
              value={formData.theme}
              onChange={(e) => handleInputChange("theme", e.target.value)}
              className="input"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Choose your preferred theme
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleReset}
          className="btn btn-secondary flex items-center space-x-2"
          disabled={isLoading}
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary flex items-center space-x-2"
            disabled={isLoading}
          >
            <Save size={16} />
            <span>Save</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default Settings;
