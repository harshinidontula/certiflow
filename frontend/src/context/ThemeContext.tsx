import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'mint' | 'red-white';

interface ThemeContextType {
  theme: ThemeMode;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  cycleTheme: () => {},
});

const THEME_ORDER: ThemeMode[] = ['light', 'dark', 'mint', 'red-white'];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('certiflow_theme') as ThemeMode;
    return THEME_ORDER.includes(saved) ? saved : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('certiflow_theme', theme);
  }, [theme]);

  const cycleTheme = () => {
    setTheme((prev) => {
      const idx = THEME_ORDER.indexOf(prev);
      const nextIdx = (idx + 1) % THEME_ORDER.length;
      return THEME_ORDER[nextIdx];
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
