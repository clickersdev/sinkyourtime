import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Play, Pause, RotateCcw, X } from "lucide-react";
import { gsap } from "gsap";
import { fadeIn, pulse, buttonPress } from "../utils/animations";

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

      // Animate in only when opening
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
      buttonPress(controlsRef.current);
    }
    onStart();
  };

  const handlePauseClick = () => {
    if (controlsRef.current) {
      buttonPress(controlsRef.current);
    }
    onPause();
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

    onReset();
  };

  if (!isOpen) return null;

  const fullscreenContent = (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-[9999] flex items-center justify-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"></div>
      </div>

      <div className="relative text-center max-w-5xl mx-auto px-8 py-12">
        {/* Project Info with enhanced styling */}
        {currentProject && (
          <div
            className="mb-12"
            ref={(el) => {
              if (el && !el.dataset.animated) {
                el.dataset.animated = "true";
                fadeIn(el, 0.1);
              }
            }}
          >
            <div className="inline-flex items-center space-x-4 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <div
                className="w-4 h-4 rounded-full shadow-lg"
                style={{ backgroundColor: currentProject.color }}
              />
              <span className="text-lg font-medium text-white/90">
                {currentProject.name}
              </span>
              {currentCategory && (
                <>
                  <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                  <span className="text-sm text-white/70">
                    {currentCategory.name}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Timer Display with enhanced styling */}
        <div className="relative mb-12">
          <div className="text-center">
            <div
              ref={timerDisplayRef}
              className="text-7xl md:text-8xl lg:text-9xl font-extralight text-white font-mono cursor-pointer hover:opacity-90 transition-all duration-300 tracking-wider"
              onDoubleClick={onDurationEdit}
            >
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Timer Label with enhanced styling */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-light text-white/80 tracking-wide">
            {getModeLabel()}
          </h2>
        </div>

        {/* Controls with enhanced styling */}
        <div
          ref={controlsRef}
          className="flex items-center justify-center space-x-8 mb-12"
        >
          {isRunning ? (
            <button
              onClick={handlePauseClick}
              className="group bg-red-500/90 hover:bg-red-500 text-white rounded-full p-8 transition-all duration-300 shadow-2xl hover:shadow-red-500/25 hover:scale-105"
            >
              <Pause
                size={36}
                className="group-hover:scale-110 transition-transform duration-300"
              />
            </button>
          ) : (
            <button
              onClick={handleStartClick}
              className="group bg-green-500/90 hover:bg-green-500 text-white rounded-full p-8 transition-all duration-300 shadow-2xl hover:shadow-green-500/25 hover:scale-105"
            >
              <Play
                size={36}
                className="group-hover:scale-110 transition-transform duration-300"
              />
            </button>
          )}

          <button
            onClick={handleResetClick}
            className="group bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-full p-6 transition-all duration-300 backdrop-blur-sm border border-white/20 hover:scale-105"
          >
            <RotateCcw
              size={28}
              className="group-hover:scale-110 transition-transform duration-300"
            />
          </button>
        </div>

        {/* Pomodoro Counter with enhanced styling */}
        <div className="mb-12">
          <div className="inline-flex flex-col items-center px-8 py-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="text-sm text-white/60 font-medium tracking-wide mb-2">
              Completed Pomodoros
            </div>
            <div className="text-4xl font-light text-white">
              {completedPomodoros}
            </div>
          </div>
        </div>

        {/* Exit Fullscreen with enhanced styling */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 backdrop-blur-sm border border-white/10 hover:scale-110"
        >
          <X size={24} />
        </button>

        {/* Instructions with enhanced styling */}
        <div className="text-sm text-white/50 space-y-2">
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <kbd className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-lg text-xs border border-white/20">
                Space
              </kbd>
              <span>start/pause</span>
            </div>
            <div className="flex items-center space-x-2">
              <kbd className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-lg text-xs border border-white/20">
                R
              </kbd>
              <span>reset</span>
            </div>
            <div className="flex items-center space-x-2">
              <kbd className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-lg text-xs border border-white/20">
                Esc
              </kbd>
              <span>exit</span>
            </div>
          </div>
          <div className="text-center">
            <span>Double-click timer to edit duration</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render at root level
  return createPortal(fullscreenContent, document.body);
};

export default FullscreenTimer;
