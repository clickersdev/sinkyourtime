import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, X } from "lucide-react";
import { gsap } from "gsap";
import { useTimerStore } from "../stores/timerStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useProjectStore } from "../stores/projectStore";
import {
  timerPulse,
  progressBarFill,
  scaleIn,
  fadeIn,
  pulse,
  buttonPress,
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
    startTimer,
    pauseTimer,
    resetTimer,
    setMode,
    tick,
    completeSession,
    incrementPomodoros,
    setProject,
    setCategory,
    updateTimeLeft,
    updateTotalTime,
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

  // Fullscreen and editing states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [editingMinutes, setEditingMinutes] = useState(25);

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

  const progress = ((totalTime - timeLeft) / totalTime) * 100;

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
        toast.success("Work session complete! Time for a long break.");
      } else {
        setMode("short_break");
        toast.success("Work session complete! Time for a short break.");
      }

      // Auto-start break if enabled
      if (settings.autoStartBreaks) {
        setTimeout(() => {
          startTimer();
        }, 1000);
      }
    } else {
      setMode("work");
      toast.success("Break complete! Ready to work?");
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
  }, []);

  // Remove continuous timer pulsing to prevent animation spam
  // Timer will only animate on initial load and user interactions

  // Animate progress bar
  useEffect(() => {
    if (progressBarRef.current) {
      progressBarFill(progressBarRef.current, progress);
    }
  }, [progress]);

  // Handle fullscreen mode - only enter fullscreen when starting, don't exit when pausing
  useEffect(() => {
    if (isRunning && !isFullscreen) {
      setIsFullscreen(true);
    }
    // Removed automatic exit when pausing - user now has full control
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
    if (selectedProject && selectedProject !== currentProject) {
      setProject(selectedProject);
    }
    if (selectedCategory && selectedCategory !== currentCategory) {
      setCategory(selectedCategory);
    }
  }, [selectedProject, selectedCategory]);

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
      } else if (e.code === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [isRunning, isFullscreen]);

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
    // Find the reset button icon and animate just that
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
    toast.success("Timer duration updated!");
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
        currentMode={currentMode}
        completedPomodoros={completedPomodoros}
        currentProject={currentProject}
        currentCategory={currentCategory}
        onStart={startTimer}
        onPause={pauseTimer}
        onReset={resetTimer}
        onDurationEdit={handleDurationEdit}
        formatTime={formatTime}
        getModeLabel={getModeLabel}
      />
    );
  }

  // Regular timer layout
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] p-8">
      {/* Project and Category Display */}
      <div
        className="text-center mb-8"
        ref={(el) => {
          if (el) fadeIn(el, 0.1);
        }}
      >
        {currentProject && (
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: currentProject.color }}
            />
            <span className="text-lg font-medium text-gray-900">
              {currentProject.name}
            </span>
          </div>
        )}
        {currentCategory && (
          <div className="text-sm text-gray-500">{currentCategory.name}</div>
        )}
      </div>

      {/* Timer Display with enhanced animations */}
      <div className="relative mb-8">
        <div className="text-center">
          <div
            ref={timerDisplayRef}
            className="timer-digit cursor-pointer hover:opacity-80 transition-opacity"
            onDoubleClick={handleDurationEdit}
          >
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Timer Label */}
      <div
        className="text-center mb-8"
        ref={(el) => {
          if (el) fadeIn(el, 0.3);
        }}
      >
        <h2 className="text-xl font-semibold text-gray-900">
          {getModeLabel()}
        </h2>
      </div>

      {/* Progress Bar with GSAP animation */}
      <div className="w-full max-w-md mb-8">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            ref={progressBarRef}
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: "0%" }}
          />
        </div>
      </div>

      {/* Controls with enhanced animations */}
      <div ref={controlsRef} className="flex items-center space-x-4 mb-8">
        {isRunning ? (
          <button
            onClick={handlePauseClick}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Pause size={20} />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={handleStartClick}
            className="btn btn-primary flex items-center space-x-2"
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
      </div>

      {/* Mode Selector with enhanced animations */}
      <div
        ref={modeSelectorRef}
        className="flex space-x-2 bg-white rounded-lg p-1 shadow-sm border mb-8"
      >
        <button
          onClick={() => setMode("work")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentMode === "work"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Work
        </button>
        <button
          onClick={() => setMode("short_break")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentMode === "short_break"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Break
        </button>
        <button
          onClick={() => setMode("long_break")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentMode === "long_break"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Long Break
        </button>
      </div>

      {/* Pomodoro Counter with enhanced animations */}
      <div ref={pomodoroCounterRef} className="text-center mb-8">
        <div className="text-sm text-gray-500">Completed Pomodoros</div>
        <div className="text-2xl font-bold text-blue-600">
          {completedPomodoros}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-gray-500">
        <p>
          Press{" "}
          <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Space</kbd> to
          start/pause
        </p>
        <p>
          Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">R</kbd>{" "}
          to reset
        </p>
        <p>Double-click timer to edit duration</p>
      </div>

      {/* Duration Edit Modal */}
      <Modal
        isOpen={isEditingDuration}
        onClose={handleDurationCancel}
        title="Edit Timer Duration"
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (minutes)
          </label>
          <input
            type="number"
            min="1"
            max="120"
            value={editingMinutes}
            onChange={(e) => setEditingMinutes(parseInt(e.target.value) || 25)}
            className="input text-center text-2xl font-mono"
            autoFocus
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button onClick={handleDurationCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleDurationSave} className="btn btn-primary">
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Timer;
