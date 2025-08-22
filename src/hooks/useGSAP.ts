import { useRef, useCallback } from "react";
import { gsap } from "gsap";

export const useGSAP = () => {
  const scope = useRef<HTMLDivElement>(null);

  const register = useCallback(() => {
    if (scope.current) {
      gsap.context(() => {
        // GSAP context setup
      }, scope.current);
    }
  }, []);

  return { scope, register };
};
