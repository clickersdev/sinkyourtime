import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Play, Pause, RotateCcw, X } from "lucide-react";
import { gsap } from "gsap";
import { fadeIn, pulse } from "../utils/animations";

interface FullscreenTimerProps {
  isOpen: boolean;
  onClose: () => void;
  timeLeft: number;
  isRunning: boolean;
  currentMode: string;
  completedPomodoros: number;
  currentProject?: any;
  currentCategory?: any;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onDurationEdit: () => void;
  formatTime: (seconds: number) => string;
  getModeLabel: () => string;
}

const FullscreenTimer: React.FC<FullscreenTimerProps> = ({
  isOpen,
  onClose,
  timeLeft,
  isRunning,
  currentMode,
  completedPomodoros,
  currentProject,
  currentCategory,
  onStart,
  onPause,
  onReset,
  onDurationEdit,
  formatTime,
  getModeLabel,
}) => {
  const timerDisplayRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when fullscreen is open
      document.body.style.overflow = "hidden";

      // Animate in
      if (timerDisplayRef.current) {
        fadeIn(timerDisplayRef.current, 0.1);
      }
      if (controlsRef.current) {
        fadeIn(controlsRef.current, 0.2);
      }
    } else {
      // Restore body scroll
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Enhanced button click animations
  const handleStartClick = () => {
    if (controlsRef.current) {
      pulse(controlsRef.current);
    }
    onStart();
  };

  const handlePauseClick = () => {
    if (controlsRef.current) {
      pulse(controlsRef.current);
    }
    onPause();
  };

  const handleResetClick = () => {
    if (controlsRef.current) {
      gsap.to(controlsRef.current, {
        rotation: 360,
        duration: 0.5,
        ease: "power2.out",
      });
    }
    onReset();
  };

  if (!isOpen) return null;

  const fullscreenContent = (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 z-[9999] flex items-center justify-center">
      <div className="text-center max-w-4xl mx-auto px-8 py-8">
        {/* Project Info with fade-in */}
        {currentProject && (
          <div
            className="mb-8"
            ref={(el) => {
              if (el) fadeIn(el, 0.1);
            }}
          >
            <div className="flex items-center justify-center space-x-3 mb-2">
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: currentProject.color }}
              />
              <span className="text-xl font-semibold text-gray-800">
                {currentProject.name}
              </span>
            </div>
            {currentCategory && (
              <p className="text-gray-600">{currentCategory.name}</p>
            )}
          </div>
        )}

        {/* Timer Display with enhanced animations */}
        <div className="relative mb-8">
          <div className="text-center">
            <div
              ref={timerDisplayRef}
              className="text-8xl md:text-9xl font-light text-gray-900 font-mono cursor-pointer hover:opacity-80 transition-opacity"
              onDoubleClick={onDurationEdit}
            >
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Timer Label */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800">
            {getModeLabel()}
          </h2>
        </div>

        {/* Controls with enhanced animations */}
        <div
          ref={controlsRef}
          className="flex items-center justify-center space-x-6 mb-8"
        >
          {isRunning ? (
            <button
              onClick={handlePauseClick}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-6 transition-colors"
            >
              <Pause size={32} />
            </button>
          ) : (
            <button
              onClick={handleStartClick}
              className="bg-green-500 hover:bg-green-600 text-white rounded-full p-6 transition-colors"
            >
              <Play size={32} />
            </button>
          )}

          <button
            onClick={handleResetClick}
            className="bg-gray-500 hover:bg-gray-600 text-white rounded-full p-4 transition-colors"
          >
            <RotateCcw size={24} />
          </button>
        </div>

        {/* Pomodoro Counter */}
        <div className="mb-8">
          <div className="text-sm text-gray-600">Completed Pomodoros</div>
          <div className="text-3xl font-bold text-blue-600">
            {completedPomodoros}
          </div>
        </div>

        {/* Exit Fullscreen */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-full transition-colors"
        >
          <X size={24} />
        </button>

        {/* Instructions */}
        <div className="text-sm text-gray-500">
          <p>
            Press{" "}
            <kbd className="px-2 py-1 bg-white rounded text-xs">Space</kbd> to
            start/pause
          </p>
          <p>
            Press <kbd className="px-2 py-1 bg-white rounded text-xs">R</kbd> to
            reset
          </p>
          <p>
            Press <kbd className="px-2 py-1 bg-white rounded text-xs">Esc</kbd>{" "}
            to exit fullscreen
          </p>
          <p>Double-click timer to edit duration</p>
        </div>
      </div>
    </div>
  );

  // Use portal to render at root level
  return createPortal(fullscreenContent, document.body);
};

export default FullscreenTimer;
