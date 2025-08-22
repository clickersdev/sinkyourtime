import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Save,
  Maximize2,
  Minimize2,
  Settings,
  Target,
  Clock,
  Coffee,
  Zap,
  AlertCircle,
  CheckCircle,
  X,
  Edit3,
  Download,
  Share2,
} from "lucide-react";
import { gsap } from "gsap";
import { useTimerStore } from "../stores/timerStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useProjectStore } from "../stores/projectStore";
import {
  progressBarFill,
  scaleIn,
  fadeIn,
  buttonPress,
  slideInUp,
} from "../utils/animations";
import Modal from "./Modal";
import FullscreenTimer from "./FullscreenTimer";
import toast from "react-hot-toast";

const Timer: React.FC = () => {
  const {
    isRunning,
    currentMode,
    timeLeft,
    totalTime,
    currentProject,
    currentCategory,
    completedPomodoros,
    sessionStartTime,
    startTimer,
    pauseTimer,
    resetTimer,
    setMode,
    tick,
    completeSession,
    saveCurrentSession,
    incrementPomodoros,
    setProject,
    setCategory,
    updateTimeLeft,
    updateTotalTime,
    clearCurrentSession,
  } = useTimerStore();

  const { settings } = useSettingsStore();
  const { currentProject: selectedProject, currentCategory: selectedCategory } =
    useProjectStore();
  const intervalRef = useRef<number | null>(null);

  // GSAP refs
  const timerDisplayRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const modeSelectorRef = useRef<HTMLDivElement>(null);
  const pomodoroCounterRef = useRef<HTMLDivElement>(null);
  const sessionInfoRef = useRef<HTMLDivElement>(null);

  // State management
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [editingMinutes, setEditingMinutes] = useState(25);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [showSessionInfo, setShowSessionInfo] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Memoized calculations
  const progress = useMemo(() => ((totalTime - timeLeft) / totalTime) * 100, [totalTime, timeLeft]);
  
  const sessionDuration = useMemo(() => {
    if (!sessionStartTime) return 0;
    const now = isRunning ? new Date() : new Date();
    return Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
  }, [sessionStartTime, isRunning]);

  const getModeLabel = () => {
    switch (currentMode) {
      case "work":
        return "Work Time";
      case "short_break":
        return "Short Break";
      case "long_break":
        return "Long Break";
      default:
        return "Work Time";
    }
  };

  const getModeIcon = () => {
    switch (currentMode) {
      case "work":
        return <Target className="w-5 h-5" />;
      case "short_break":
        return <Coffee className="w-5 h-5" />;
      case "long_break":
        return <Zap className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getModeColor = () => {
    switch (currentMode) {
      case "work":
        return "from-blue-500 to-blue-600";
      case "short_break":
        return "from-green-500 to-green-600";
      case "long_break":
        return "from-purple-500 to-purple-600";
      default:
        return "from-blue-500 to-blue-600";
    }
  };

  const handleTimerComplete = async () => {
    // Animate completion
    if (timerDisplayRef.current) {
      gsap.to(timerDisplayRef.current, {
        scale: 1.1,
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        ease: "back.out(1.7)",
      });
    }

    await completeSession();

    if (currentMode === "work") {
      incrementPomodoros();

      // Check if it's time for a long break
      const shouldTakeLongBreak =
        (completedPomodoros + 1) % settings.longBreakInterval === 0;

      if (shouldTakeLongBreak) {
        setMode("long_break");
        toast.success("Work session complete! Time for a long break.", {
          icon: "🎉",
          duration: 4000,
        });
      } else {
        setMode("short_break");
        toast.success("Work session complete! Time for a short break.", {
          icon: "☕",
          duration: 4000,
        });
      }

      // Auto-start break if enabled
      if (settings.autoStartBreaks) {
        setTimeout(() => {
          startTimer();
        }, 1000);
      }
    } else {
      setMode("work");
      toast.success("Break complete! Ready to work?", {
        icon: "💪",
        duration: 4000,
      });
    }

    // Play notification sound
    if (settings.audioEnabled) {
      playNotificationSound();
    }

    // Show browser notification
    if (settings.notificationsEnabled && "Notification" in window) {
      if (Notification.permission === "granted") {
        const message =
          currentMode === "work"
            ? "Work session complete! Time for a break."
            : "Break complete! Ready to work?";

        new Notification("Sink Your Time", {
          body: message,
          icon: "/favicon.ico",
        });
      } else if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  };

  const handleSaveSession = async () => {
    if (!sessionStartTime) {
      toast.error("No active session to save");
      return;
    }

    if (!currentProject || !currentCategory) {
      toast.error("Please select a project and category before saving");
      return;
    }

    setIsSavingSession(true);
    try {
      await saveCurrentSession();
      toast.success("Session saved successfully!", {
        icon: "✅",
      });
    } catch (error) {
      console.error("Error saving session:", error);
      toast.error("Failed to save session");
    } finally {
      setIsSavingSession(false);
    }
  };

  const handleClearSession = () => {
    clearCurrentSession();
    toast.success("Session cleared", {
      icon: "🗑️",
    });
  };

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error("Error playing notification sound:", error);
    }
  };

  // Initialize animations on mount
  useEffect(() => {
    if (timerDisplayRef.current) {
      scaleIn(timerDisplayRef.current);
    }
    if (controlsRef.current) {
      fadeIn(controlsRef.current, 0.2);
    }
    if (modeSelectorRef.current) {
      fadeIn(modeSelectorRef.current, 0.4);
    }
    if (pomodoroCounterRef.current) {
      fadeIn(pomodoroCounterRef.current, 0.6);
    }
    if (sessionInfoRef.current) {
      slideInUp(sessionInfoRef.current, 0.8);
    }
  }, []);

  // Animate progress bar
  useEffect(() => {
    if (progressBarRef.current) {
      progressBarFill(progressBarRef.current, progress);
    }
  }, [progress]);

  // Handle fullscreen mode
  useEffect(() => {
    if (isRunning && !isFullscreen) {
      setIsFullscreen(true);
    }
  }, [isRunning]);

  // Timer interval effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        tick();
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // Sync with project store
  useEffect(() => {
    if (
      selectedProject &&
      (!currentProject || selectedProject.id !== currentProject.id)
    ) {
      setProject(selectedProject);
    }
    if (
      selectedCategory &&
      (!currentCategory || selectedCategory.id !== currentCategory.id)
    ) {
      setCategory(selectedCategory);
    }
  }, [selectedProject, selectedCategory, currentProject, currentCategory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (isRunning) {
          pauseTimer();
        } else {
          startTimer();
        }
      } else if (e.code === "KeyR") {
        resetTimer();
      } else if (e.code === "KeyS" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSaveSession();
      } else if (e.code === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      } else if (e.code === "KeyF") {
        setIsFullscreen(!isFullscreen);
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [
    isRunning,
    isFullscreen,
    sessionStartTime,
    currentProject,
    currentCategory,
  ]);

  // Enhanced button click animations
  const handleStartClick = () => {
    if (controlsRef.current) {
      buttonPress(controlsRef.current);
    }
    startTimer();
  };

  const handlePauseClick = () => {
    if (controlsRef.current) {
      buttonPress(controlsRef.current);
    }
    pauseTimer();
  };

  const handleResetClick = () => {
    const resetButton = controlsRef.current?.querySelector("button:last-child");
    const resetIcon = resetButton?.querySelector("svg");

    if (resetIcon) {
      gsap.to(resetIcon, {
        rotation: 360,
        duration: 0.4,
        ease: "power2.out",
      });
    }

    resetTimer();
  };

  // Handle duration editing
  const handleDurationEdit = () => {
    if (!isRunning) {
      setEditingMinutes(Math.floor(totalTime / 60));
      setIsEditingDuration(true);
    }
  };

  const handleDurationSave = () => {
    const newTotalTime = editingMinutes * 60;
    updateTotalTime(newTotalTime);
    updateTimeLeft(newTotalTime);
    setIsEditingDuration(false);
    toast.success("Timer duration updated!", {
      icon: "⚙️",
    });
  };

  const handleDurationCancel = () => {
    setIsEditingDuration(false);
  };

  // Fullscreen timer component
  if (isFullscreen) {
    return (
      <FullscreenTimer
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        timeLeft={timeLeft}
        isRunning={isRunning}
        currentProject={currentProject}
        currentCategory={currentCategory}
        sessionStartTime={sessionStartTime}
        onStart={startTimer}
        onPause={pauseTimer}
        onReset={resetTimer}
        onSaveSession={handleSaveSession}
        onDurationEdit={handleDurationEdit}
        formatTime={formatTime}
        getModeLabel={getModeLabel}
      />
    );
  }

  // Regular timer layout
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] p-8">
      {/* Session Info Panel */}
      {sessionStartTime && (
        <div
          ref={sessionInfoRef}
          className="w-full max-w-2xl mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Active Session
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Started {sessionStartTime.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSessionInfo(!showSessionInfo)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {showSessionInfo ? <X size={16} /> : <Settings size={16} />}
              </button>
            </div>
          </div>
          
          {showSessionInfo && (
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Session Duration</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {formatTime(sessionDuration)}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Time Remaining</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {formatTime(timeLeft)}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveSession}
                  disabled={isSavingSession}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save size={16} />
                  <span>{isSavingSession ? "Saving..." : "Save Session"}</span>
                </button>
                <button
                  onClick={handleClearSession}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <X size={16} />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Project and Category Display */}
      <div
        className="text-center mb-8"
        ref={(el) => {
          if (el) fadeIn(el, 0.1);
        }}
      >
        {currentProject && (
          <div className="flex items-center justify-center space-x-3 mb-3">
            <div
              className="w-6 h-6 rounded-full shadow-lg"
              style={{ backgroundColor: currentProject.color }}
            />
            <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {currentProject.name}
            </span>
            {currentCategory && (
              <>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span className="text-lg text-gray-600 dark:text-gray-400">
                  {currentCategory.name}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Timer Display */}
      <div className="relative mb-8">
        <div className="text-center">
          <div
            ref={timerDisplayRef}
            className="timer-digit cursor-pointer hover:opacity-80 transition-opacity group"
            onDoubleClick={handleDurationEdit}
          >
            {formatTime(timeLeft)}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit3 className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Timer Label with Mode Icon */}
      <div
        className="text-center mb-8"
        ref={(el) => {
          if (el) fadeIn(el, 0.3);
        }}
      >
        <div className="flex items-center justify-center space-x-3 mb-2">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${getModeColor()} text-white`}>
            {getModeIcon()}
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {getModeLabel()}
          </h2>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mb-8">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            ref={progressBarRef}
            className={`h-3 rounded-full bg-gradient-to-r ${getModeColor()} transition-all duration-300`}
            style={{ width: "0%" }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
          <span>{formatTime(totalTime - timeLeft)}</span>
          <span>{formatTime(totalTime)}</span>
        </div>
      </div>

      {/* Controls */}
      <div ref={controlsRef} className="flex items-center space-x-4 mb-8">
        {isRunning ? (
          <button
            onClick={handlePauseClick}
            className="btn btn-primary flex items-center space-x-2 bg-red-600 hover:bg-red-700"
          >
            <Pause size={20} />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={handleStartClick}
            className="btn btn-primary flex items-center space-x-2 bg-green-600 hover:bg-green-700"
          >
            <Play size={20} />
            <span>Start</span>
          </button>
        )}

        <button
          onClick={handleResetClick}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <RotateCcw size={20} />
          <span>Reset</span>
        </button>

        <button
          onClick={() => setIsFullscreen(true)}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <Maximize2 size={20} />
          <span>Fullscreen</span>
        </button>
      </div>

      {/* Mode Selector */}
      <div
        ref={modeSelectorRef}
        className="flex space-x-2 bg-white dark:bg-gray-800 rounded-xl p-2 shadow-lg border dark:border-gray-700 mb-8"
      >
        <button
          onClick={() => setMode("work")}
          className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
            currentMode === "work"
              ? "bg-blue-600 text-white shadow-lg"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          <Target size={16} />
          <span>Work</span>
        </button>
        <button
          onClick={() => setMode("short_break")}
          className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
            currentMode === "short_break"
              ? "bg-green-600 text-white shadow-lg"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          <Coffee size={16} />
          <span>Break</span>
        </button>
        <button
          onClick={() => setMode("long_break")}
          className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
            currentMode === "long_break"
              ? "bg-purple-600 text-white shadow-lg"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          <Zap size={16} />
          <span>Long Break</span>
        </button>
      </div>

      {/* Pomodoro Counter */}
      <div ref={pomodoroCounterRef} className="text-center mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Completed Pomodoros
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {completedPomodoros}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Next long break after {settings.longBreakInterval - (completedPomodoros % settings.longBreakInterval)} more
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          <Settings size={16} />
          <span>Quick Actions</span>
        </button>
      </div>

      {showQuickActions && (
        <div className="w-full max-w-md mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDurationEdit}
              className="flex items-center space-x-2 p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Edit3 size={16} />
              <span>Edit Duration</span>
            </button>
            <button
              onClick={() => navigator.share && navigator.share({ title: 'Sink Your Time', text: 'Check out my productivity!' })}
              className="flex items-center space-x-2 p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Share2 size={16} />
              <span>Share Progress</span>
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 space-y-2">
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              Space
            </kbd>
            <span>start/pause</span>
          </div>
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              R
            </kbd>
            <span>reset</span>
          </div>
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              F
            </kbd>
            <span>fullscreen</span>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              Ctrl+S
            </kbd>
            <span>save session</span>
          </div>
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              Esc
            </kbd>
            <span>exit fullscreen</span>
          </div>
        </div>
        <p className="text-xs">Double-click timer to edit duration</p>
      </div>

      {/* Duration Edit Modal */}
      <Modal
        isOpen={isEditingDuration}
        onClose={handleDurationCancel}
        title="Edit Timer Duration"
      >
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Duration (minutes)
          </label>
          <input
            type="number"
            min="1"
            max="120"
            value={editingMinutes}
            onChange={(e) => setEditingMinutes(parseInt(e.target.value) || 25)}
            className="input text-center text-3xl font-mono w-full"
            autoFocus
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Enter a value between 1 and 120 minutes
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button onClick={handleDurationCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleDurationSave} className="btn btn-primary">
            Save Changes
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Timer;
