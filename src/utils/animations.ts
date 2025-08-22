import { gsap } from 'gsap';

// Animation presets for consistent timing and easing
export const ANIMATION_PRESETS = {
  fast: { duration: 0.2, ease: "power2.out" },
  normal: { duration: 0.3, ease: "power2.out" },
  slow: { duration: 0.5, ease: "power2.out" },
  bounce: { duration: 0.4, ease: "back.out(1.7)" },
  elastic: { duration: 0.6, ease: "elastic.out(1, 0.3)" }
};

// Common animation functions
export const fadeIn = (element: HTMLElement, delay = 0) => {
  return gsap.fromTo(element, 
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, delay, ...ANIMATION_PRESETS.normal }
  );
};

export const fadeOut = (element: HTMLElement, delay = 0) => {
  return gsap.to(element, {
    opacity: 0,
    y: -20,
    delay,
    ...ANIMATION_PRESETS.fast
  });
};

export const slideInFromLeft = (element: HTMLElement, delay = 0) => {
  return gsap.fromTo(element,
    { x: -50, opacity: 0 },
    { x: 0, opacity: 1, delay, ...ANIMATION_PRESETS.normal }
  );
};

export const slideInFromRight = (element: HTMLElement, delay = 0) => {
  return gsap.fromTo(element,
    { x: 50, opacity: 0 },
    { x: 0, opacity: 1, delay, ...ANIMATION_PRESETS.normal }
  );
};

export const scaleIn = (element: HTMLElement, delay = 0) => {
  return gsap.fromTo(element,
    { scale: 0.8, opacity: 0 },
    { scale: 1, opacity: 1, delay, ...ANIMATION_PRESETS.bounce }
  );
};

export const pulse = (element: HTMLElement) => {
  return gsap.to(element, {
    scale: 1.05,
    duration: 0.2,
    yoyo: true,
    repeat: 1,
    ease: "power2.inOut"
  });
};

// Stagger animations for lists
export const staggerFadeIn = (elements: HTMLElement[], stagger = 0.1) => {
  return gsap.fromTo(elements,
    { opacity: 0, y: 30 },
    { 
      opacity: 1, 
      y: 0, 
      stagger,
      ...ANIMATION_PRESETS.normal 
    }
  );
};

// Timer-specific animations
export const timerPulse = (element: HTMLElement) => {
  return gsap.to(element, {
    scale: 1.02,
    duration: 0.3,
    yoyo: true,
    repeat: 1,
    ease: "power2.inOut"
  });
};

export const progressBarFill = (element: HTMLElement, progress: number) => {
  return gsap.to(element, {
    width: `${progress}%`,
    duration: 0.5,
    ease: "power2.out"
  });
};

// Page transition animations
export const pageTransitionIn = (element: HTMLElement) => {
  return gsap.fromTo(element,
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
  );
};

export const pageTransitionOut = (element: HTMLElement) => {
  return gsap.to(element, {
    opacity: 0,
    y: -30,
    duration: 0.3,
    ease: "power2.in"
  });
};

// Modal animations
export const modalBackdropIn = (element: HTMLElement) => {
  return gsap.fromTo(element,
    { opacity: 0 },
    { opacity: 1, duration: 0.2, ease: "power2.out" }
  );
};

export const modalBackdropOut = (element: HTMLElement) => {
  return gsap.to(element, {
    opacity: 0,
    duration: 0.2,
    ease: "power2.in"
  });
};

export const modalContentIn = (element: HTMLElement, delay = 0.1) => {
  return gsap.fromTo(element,
    { 
      opacity: 0, 
      scale: 0.9, 
      y: 20 
    },
    { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      duration: 0.3, 
      ease: "back.out(1.7)",
      delay 
    }
  );
};

export const modalContentOut = (element: HTMLElement) => {
  return gsap.to(element, {
    opacity: 0,
    scale: 0.9,
    y: -20,
    duration: 0.2,
    ease: "power2.in"
  });
};

// Enhanced page transitions with exit animations
export const pageEnter = (element: HTMLElement) => {
  return gsap.fromTo(element,
    { 
      opacity: 0, 
      y: 20,
      scale: 0.98
    },
    { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      duration: 0.4, 
      ease: "power2.out" 
    }
  );
};

export const pageExit = (element: HTMLElement) => {
  return gsap.to(element, {
    opacity: 0,
    y: -20,
    scale: 0.98,
    duration: 0.3,
    ease: "power2.in"
  });
};

// Staggered content animations
export const staggerContentIn = (elements: HTMLElement[], stagger = 0.08) => {
  return gsap.fromTo(elements,
    { 
      opacity: 0, 
      y: 25,
      scale: 0.95
    },
    { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      stagger,
      duration: 0.4, 
      ease: "power2.out" 
    }
  );
};
