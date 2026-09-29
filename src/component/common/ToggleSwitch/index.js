import React from 'react';
import classNames from 'classnames';

const ToggleSwitch = ({ enabled, onChange }) => {
  const handleToggle = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange(!enabled);
    }
  };

  return (
    <div
      onClick={handleToggle}
      className={classNames(
        { "bg-light-primary": enabled },
        { "bg-gray-300": !enabled },
        "w-14 h-7 flex items-center rounded-full px-1 cursor-pointer"
      )}
    >
      <div
        className={classNames(
          { "translate-x-7": enabled },
          { "translate-x-0": !enabled },
          "bg-[#F9F6F1] border border-gray-300 w-4 h-4 rounded-full shadow-md transform transition-transform"
        )}
      />
    </div>
  );
};

export default ToggleSwitch; 