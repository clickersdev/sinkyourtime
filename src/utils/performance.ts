import { gsap } from "gsap";

// Optimize GSAP for better performance
export const optimizeGSAP = () => {
  // Set default settings for better performance
  gsap.defaults({
    ease: "power2.out",
    duration: 0.3,
  });
};

// Use will-change for elements that will animate frequently
export const setWillChange = (element: HTMLElement, property: string) => {
  element.style.willChange = property;

  // Reset will-change after animation
  setTimeout(() => {
    element.style.willChange = "auto";
  }, 1000);
};

// Batch DOM updates for better performance
export const batchUpdate = (updates: (() => void)[]) => {
  requestAnimationFrame(() => {
    updates.forEach((update) => update());
  });
};

// Initialize GSAP optimizations
optimizeGSAP();

// Performance monitoring utilities
export const measurePerformance = (_name: string, fn: () => void) => {
  fn();
  // Performance measurement completed
};

// Session validation utilities
export const validateSessionData = (session: any) => {
  const errors: string[] = [];

  if (!session.projectId) {
    errors.push("Missing projectId");
  }

  if (!session.categoryId) {
    errors.push("Missing categoryId");
  }

  if (!session.startTime) {
    errors.push("Missing startTime");
  }

  if (
    typeof session.plannedDuration !== "number" ||
    session.plannedDuration <= 0
  ) {
    errors.push("Invalid plannedDuration");
  }

  if (
    typeof session.actualDuration !== "number" ||
    session.actualDuration < 0
  ) {
    errors.push("Invalid actualDuration");
  }

  if (!["work", "short_break", "long_break"].includes(session.type)) {
    errors.push("Invalid session type");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Time conversion utilities
export const secondsToMilliseconds = (seconds: number): number => {
  return seconds * 1000;
};

export const millisecondsToSeconds = (milliseconds: number): number => {
  return Math.floor(milliseconds / 1000);
};

export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

// Session logging utilities
export const logSessionData = (_session: any, _context: string = "Session") => {
  // Session data logged for debugging purposes
};
