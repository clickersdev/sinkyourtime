import { useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';

export const useGSAP = () => {
  const elementRef = useRef<HTMLElement>(null);

  const animate = useCallback((animationFn: (element: HTMLElement) => any) => {
    if (elementRef.current) {
      return animationFn(elementRef.current);
    }
  }, []);

  const animateIn = useCallback((preset: 'fadeIn' | 'slideIn' | 'scaleIn' = 'fadeIn') => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    
    switch (preset) {
      case 'fadeIn':
        gsap.fromTo(element, 
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
        );
        break;
      case 'slideIn':
        gsap.fromTo(element,
          { x: -50, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" }
        );
        break;
      case 'scaleIn':
        gsap.fromTo(element,
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" }
        );
        break;
    }
  }, []);

  const animateOut = useCallback(() => {
    if (elementRef.current) {
      gsap.to(elementRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.2,
        ease: "power2.in"
      });
    }
  }, []);

  return { elementRef, animate, animateIn, animateOut };
};
