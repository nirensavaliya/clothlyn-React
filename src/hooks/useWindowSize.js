import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  });

  useEffect(() => {
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      setWindowSize({
        width: currentWidth,
        height: window.innerHeight,
        isMobile: currentWidth < MOBILE_BREAKPOINT,
        isTablet: currentWidth >= MOBILE_BREAKPOINT && currentWidth < TABLET_BREAKPOINT,
        isDesktop: currentWidth >= TABLET_BREAKPOINT,
      });
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

export default useWindowSize;