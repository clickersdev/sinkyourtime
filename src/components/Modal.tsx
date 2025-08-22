import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { 
  modalBackdropIn, 
  modalBackdropOut, 
  modalContentIn, 
  modalContentOut 
} from "../utils/animations";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  className = "" 
}) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Animate modal in
      if (backdropRef.current) {
        modalBackdropIn(backdropRef.current);
      }
      if (contentRef.current) {
        modalContentIn(contentRef.current);
      }
    } else {
      // Animate modal out
      if (backdropRef.current) {
        modalBackdropOut(backdropRef.current);
      }
      if (contentRef.current) {
        modalContentOut(contentRef.current);
      }
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      style={{ opacity: 0 }}
    >
      <div
        ref={contentRef}
        className={`bg-white rounded-lg shadow-xl max-w-md w-full mx-4 ${className}`}
        style={{ 
          opacity: 0, 
          transform: 'scale(0.9) translateY(20px)' 
        }}
      >
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
