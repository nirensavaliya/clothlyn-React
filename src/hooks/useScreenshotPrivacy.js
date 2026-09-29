import { useCallback, useEffect, useState } from 'react';

/**
 * Best-effort privacy for web (not native FLAG_SECURE).
 * Hides content when tab loses focus, app switcher opens, or capture keys are used.
 */
const useScreenshotPrivacy = () => {
  const [isPrivate, setIsPrivate] = useState(false);

  const hideContent = useCallback(() => setIsPrivate(true), []);

  const showContentIfActive = useCallback(() => {
    if (document.visibilityState === 'visible' && document.hasFocus()) {
      setIsPrivate(false);
    }
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hideContent();
      } else {
        showContentIfActive();
      }
    };

    const onBlur = () => hideContent();
    const onFocus = () => showContentIfActive();
    const onPageHide = () => hideContent();

    const onCaptureKey = (event) => {
      const key = String(event.key || '').toLowerCase();
      const isPrintScreen = key === 'printscreen';
      const isMacCapture =
        event.metaKey && event.shiftKey && (key === '3' || key === '4' || key === '5');
      const isWinSnip = event.metaKey && event.shiftKey && key === 's';

      if (!isPrintScreen && !isMacCapture && !isWinSnip) return;

      hideContent();
      window.setTimeout(showContentIfActive, 2000);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('keyup', onCaptureKey);
    window.addEventListener('keydown', onCaptureKey);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('keyup', onCaptureKey);
      window.removeEventListener('keydown', onCaptureKey);
    };
  }, [hideContent, showContentIfActive]);

  return isPrivate;
};

export default useScreenshotPrivacy;
