import { gsap } from 'gsap';

// Optimize GSAP for better performance
export const optimizeGSAP = () => {
  // Set default settings for better performance
  gsap.defaults({
    ease: "power2.out",
    duration: 0.3
  });
};

// Use will-change for elements that will animate frequently
export const setWillChange = (element: HTMLElement, property: string) => {
  element.style.willChange = property;
  
  // Reset will-change after animation
  setTimeout(() => {
    element.style.willChange = 'auto';
  }, 1000);
};

// Batch DOM updates for better performance
export const batchUpdate = (updates: (() => void)[]) => {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
};

// Initialize GSAP optimizations
optimizeGSAP();
