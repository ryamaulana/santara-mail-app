import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  maxWidth?: "max-w-lg" | "max-w-xl" | "max-w-2xl" | "max-w-4xl";
}

export function Modal({ isOpen, onClose, title, children, icon, maxWidth = "max-w-xl" }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className={`bg-surface rounded-2xl w-full ${maxWidth} shadow-premium border border-border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 transition-all duration-300`}>
        <div className="px-6 py-4 border-b border-border bg-background flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {icon}
            <h3 className="font-bold text-ink text-base">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  );
}
