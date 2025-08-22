import React, { useState } from "react";
import { X, Save, RotateCcw } from "lucide-react";
import { useSettingsStore } from "../stores/settingsStore";

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

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Timer Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Timer Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <p className="text-sm text-gray-500 mt-1">
                  Take a long break after this many completed work sessions
                </p>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Notifications
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Sound Notifications
                  </label>
                  <p className="text-sm text-gray-500">
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
                  <label className="text-sm font-medium text-gray-700">
                    Browser Notifications
                  </label>
                  <p className="text-sm text-gray-500">
                    Show browser notifications when timer completes
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notificationsEnabled}
                    onChange={(e) =>
                      handleInputChange(
                        "notificationsEnabled",
                        e.target.checked
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Theme Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Appearance
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <p className="text-sm text-gray-500 mt-1">
                Choose your preferred theme
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
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
      </div>
    </div>
  );
};

export default Settings;
