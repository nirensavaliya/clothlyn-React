import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

const ActionCell = ({ row, options = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [menuReady, setMenuReady] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const GAP = 8;

  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const buttonHeight = rect.height;
      setMenuPosition({
        top: rect.top + window.scrollY + (buttonHeight / 2),
        left: rect.left + window.scrollX,
      });
      setMenuReady(false);
    }
    setIsOpen((prev) => !prev);
  };

  const handleOptionClick = (e, actionCallback) => {
    e.stopPropagation();
    if (actionCallback) {
      actionCallback(row);
    }
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen && menuRef.current && buttonRef.current && !menuReady) {
      const menuHeight = menuRef.current.offsetHeight;
      const menuWidth = menuRef.current.offsetWidth;
      const rect = buttonRef.current.getBoundingClientRect();
      const buttonHeight = rect.height;
      const minLeft = 8;
      let left = rect.left + window.scrollX - menuWidth - GAP;
      if (left < minLeft) left = minLeft;
      setMenuPosition({
        top: rect.top + window.scrollY + (buttonHeight / 2) - (menuHeight / 2),
        left,
      });
      setMenuReady(true);
    }
  }, [isOpen, menuReady]);

  useEffect(() => {
    if (!isOpen || !menuReady) return;
    const updateMenuPosition = () => {
      if (buttonRef.current && menuRef.current) {
        const menuHeight = menuRef.current.offsetHeight;
        const menuWidth = menuRef.current.offsetWidth;
        const rect = buttonRef.current.getBoundingClientRect();
        const buttonHeight = rect.height;
        const minLeft = 8;
        let left = rect.left + window.scrollX - menuWidth - GAP;
        if (left < minLeft) left = minLeft;
        setMenuPosition({
          top: rect.top + window.scrollY + (buttonHeight / 2) - (menuHeight / 2),
          left,
        });
      }
    };
    window.addEventListener('scroll', updateMenuPosition, true);
    window.addEventListener('resize', updateMenuPosition);
    updateMenuPosition();
    return () => {
      window.removeEventListener('scroll', updateMenuPosition, true);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [isOpen, menuReady]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const menu =
    isOpen && options.length > 0
      ? createPortal(
          <div
            ref={menuRef}
            className="absolute min-w-[140px] bg-light-white border border-light-natural_300 rounded-md shadow-lg z-[9999] py-1 w-max"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              visibility: menuReady ? 'visible' : 'hidden',
            }}
          >
            {options.map((option, index) => (
              <button
                key={option.label || index}
                onClick={(e) => handleOptionClick(e, option.action)}
                className={`w-full text-left px-4 py-2 text-sm flex items-center hover:bg-gray-100 ${option.className || 'text-gray-700'} ${
                  index < options.length - 1 ? 'border-b border-light-natural_300' : ''
                }`}
                disabled={option.disabled}
              >
                {option.icon && <span className="mr-2">{option.icon}</span>}
                {option.label}
              </button>
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="p-1 rounded-full hover:bg-gray-200 focus:outline-none flex items-center"
        aria-label="Actions"
        style={{ justifyContent: 'flex-start' }}
      >
        <MoreVertical size={16} className="mr-0.5" />
      </button>
      {menu}
    </>
  );
};

export default ActionCell;