import { useState, useEffect } from 'react';
import { lightTheme, darkTheme } from '../theme/theme';

const useTheme = () => {
  const [theme, setTheme] = useState('light');
  const [themeColors, setThemeColors] = useState(lightTheme);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      setThemeColors(savedTheme === 'light' ? lightTheme : darkTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setThemeColors(newTheme === 'light' ? lightTheme : darkTheme);
    localStorage.setItem('theme', newTheme);
  };

  return {
    theme,
    themeColors,
    toggleTheme,
    isDarkMode: theme === 'dark'
  };
};

export default useTheme; 