import React, { useEffect } from "react";
import { createPortal } from "react-dom";

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
  className = "",
}) => {
  const backdropRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Modal animation logic removed for now
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

  const modalContent = (
    <div
      ref={backdropRef}
      className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-[9999]"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      style={{ opacity: 0 }}
    >
      <div
        ref={contentRef}
        className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl shadow-2xl max-w-md w-full mx-4 border border-white/20 dark:border-gray-700/50 ${className}`}
        style={{
          opacity: 0,
          transform: "scale(0.9) translateY(20px)",
        }}
      >
        {title && (
          <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );

  // Use portal to render at document.body level
  return createPortal(modalContent, document.body);
};

export default Modal;
