import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  textSize: 'small' | 'medium' | 'large' | 'extra-large';
  toggleTheme: () => void;
  setTextSize: (size: 'small' | 'medium' | 'large' | 'extra-large') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [textSize, setTextSizeState] = useState<'small' | 'medium' | 'large' | 'extra-large'>('medium');

  useEffect(() => {
    const storedTheme = localStorage.getItem('surpluslink_theme') as 'light' | 'dark';
    const storedTextSize = localStorage.getItem('surpluslink_text_size') as 'small' | 'medium' | 'large' | 'extra-large';
    
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
    
    if (storedTextSize) {
      setTextSizeState(storedTextSize);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('surpluslink_theme', theme);
  }, [theme]);

  useEffect(() => {
    // Remove existing text size classes
    document.documentElement.classList.remove('text-small', 'text-medium', 'text-large', 'text-extra-large');
    
    // Add current text size class
    document.documentElement.classList.add(`text-${textSize}`);
    
    localStorage.setItem('surpluslink_text_size', textSize);
  }, [textSize]);
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTextSize = (size: 'small' | 'medium' | 'large' | 'extra-large') => {
    setTextSizeState(size);
  };
  return (
    <ThemeContext.Provider value={{ theme, textSize, toggleTheme, setTextSize }}>
      {children}
    </ThemeContext.Provider>
  );
};