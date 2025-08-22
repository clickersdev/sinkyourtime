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
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name} took ${end - start}ms`);
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

// Session debugging utilities
export const logSessionData = (session: any, context: string = "Session") => {
  console.group(`${context} Data`);
  console.log("Project ID:", session.projectId);
  console.log("Category ID:", session.categoryId);
  console.log("Type:", session.type);
  console.log("Start Time:", session.startTime);
  console.log("End Time:", session.endTime);
  console.log("Planned Duration:", formatDuration(session.plannedDuration));
  console.log("Actual Duration:", formatDuration(session.actualDuration));
  console.log("Completed:", session.completed);
  console.groupEnd();
};
