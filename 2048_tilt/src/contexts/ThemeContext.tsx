import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  backgroundColor: string;
  textColor: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Load dark mode preference from storage on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('darkMode');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'true');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };
    loadThemePreference();
  }, []);

  // Save dark mode preference to storage when it changes
  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      await AsyncStorage.setItem('darkMode', newMode.toString());
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const backgroundColor = isDarkMode ? '#0C4B50' : '#FFF8DC';
  const textColor = isDarkMode ? '#E8E8E8' : '#000000'; // Off white/light grey for dark mode

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, backgroundColor, textColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

