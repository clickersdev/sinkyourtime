import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { pageEnter, staggerContentIn } from "../utils/animations";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Animate the main container
      pageEnter(containerRef.current);
      
      // Animate child elements with stagger
      const childElements = containerRef.current.querySelectorAll(
        '.card, .btn, .input, h1, h2, h3, p, .grid > div'
      );
      
      if (childElements.length > 0) {
        // Convert NodeList to array and filter for HTMLElements
        const elements = Array.from(childElements).filter(
          (el): el is HTMLElement => el instanceof HTMLElement
        );
        
        if (elements.length > 0) {
          staggerContentIn(elements);
        }
      }
    }
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

export default PageTransition;
