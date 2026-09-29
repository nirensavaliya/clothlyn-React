import React from 'react';
import useScreenshotPrivacy from '../../hooks/useScreenshotPrivacy';

/**
 * Wraps sensitive screens (salary, payment) with a black privacy overlay
 * when the page is not in focus or a capture shortcut is detected.
 */
const SecureScreen = ({ children, message = 'Protected content' }) => {
  const isPrivate = useScreenshotPrivacy();

  return (
    <div className="relative">
      <div
        className="secure-screen-content"
        onContextMenu={(event) => event.preventDefault()}
        onCopy={(event) => event.preventDefault()}
        style={{
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
      >
        {children}
      </div>

      {isPrivate ? (
        <div
          className="fixed inset-0 z-[99999] bg-black flex items-center justify-center"
          aria-hidden="true"
        >
          <p className="text-white text-sm opacity-60 px-6 text-center">{message}</p>
        </div>
      ) : null}
    </div>
  );
};

export default SecureScreen;
