import React, { useEffect } from 'react';
import { LucideX } from 'lucide-react';
import classNames from 'classnames';
import { createPortal } from 'react-dom';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footerContent,
  size = 'md',
}) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-5xl',
    fullscreen: 'w-full max-w-7xl h-[calc(100vh-64px)] rounded-xl',
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(11, 28, 48, 0.55)' }}
      onClick={onClose}
    >
      <div
        className={classNames(
          'bg-[#F7F3EE] rounded-2xl shadow-2xl flex flex-col w-full relative max-h-[90vh] overflow-hidden border border-[#E8DFD4]',
          sizeClasses[size] || sizeClasses.md
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex justify-between items-center px-6 py-4 border-b border-[#E8DFD4] flex-shrink-0 bg-[#F7F3EE]">
            <h3 className="text-xl font-semibold text-[#0B1C30]">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#7D766C] hover:bg-[#EFE7DC] hover:text-[#0B1C30] transition-colors"
            >
              <LucideX size={22} />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 scrollbar min-h-0 bg-[#F7F3EE]">
          {children}
        </div>

        {footerContent && (
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#E8DFD4] flex-shrink-0 bg-[#F7F3EE]">
            {footerContent}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
