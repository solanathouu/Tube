import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, themeBase } from '../theme/theme';

const ThemeContext = createContext();

const THEME_STORAGE_KEY = '@tube_theme_preference';

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  const [isLoading, setIsLoading] = useState(true);

  // Charger la préférence de thème au démarrage
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    } catch (error) {
      console.error('Erreur chargement thème:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveThemePreference = async (mode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Erreur sauvegarde thème:', error);
    }
  };

  // Déterminer si on utilise le thème sombre
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  // Obtenir le thème actuel
  const currentTheme = isDark ? darkTheme : lightTheme;

  // Thème complet avec base
  const theme = {
    ...themeBase,
    ...currentTheme,
    colors: currentTheme.colors,
  };

  // Changer le thème
  const setTheme = (mode) => {
    setThemeMode(mode);
    saveThemePreference(mode);
  };

  // Toggle rapide entre clair et sombre
  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setTheme(newMode);
  };

  const value = {
    theme,
    isDark,
    themeMode,
    setTheme,
    toggleTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default ThemeContext;
