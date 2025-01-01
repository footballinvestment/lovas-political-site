// src/context/ThemeContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

// Típus definíciók
interface ThemeColors {
  gradientFrom: string;
  gradientTo: string;
  background: string;
  textPrimary: string;
  textSecondary: string;
  primary: string;
  secondary: string;
}

interface Theme {
  id: string;
  name: string;
  description?: string;
  colors: ThemeColors;
  isDark: boolean;
  routes?: string[];
}

interface ThemeContextType {
  currentTheme: Theme;
  setCurrentTheme: (theme: Theme) => void;
  availableThemes: Theme[];
  addTheme: (theme: Theme) => Promise<void>;
  updateTheme: (id: string, theme: Partial<Theme>) => Promise<void>;
  deleteTheme: (id: string) => Promise<void>;
  getThemeForRoute: (path: string) => Theme;
  toggleDarkMode: () => void;
  isLoading: boolean;
  error: string | null;
}

// Storage kulcsok
const STORAGE_KEYS = {
  THEMES: "lovas-political-themes",
  CURRENT_THEME: "lovas-political-current-theme",
};

// Alap téma
const defaultTheme: Theme = {
  id: "default",
  name: "Alap Téma",
  colors: {
    gradientFrom: "#8DEBD1",
    gradientTo: "#6DAEF0",
    background: "#1C1C1C",
    textPrimary: "#FFFFFF",
    textSecondary: "#A0AEC0",
    primary: "#8DEBD1",
    secondary: "#6DAEF0",
  },
  isDark: true,
  routes: ["/*"],
};

// Storage kezelő osztály
class ThemeStorage {
  static getThemes(): Theme[] {
    if (typeof window === "undefined") return [defaultTheme];

    const themes = localStorage.getItem(STORAGE_KEYS.THEMES);
    return themes ? JSON.parse(themes) : [defaultTheme];
  }

  static getCurrentTheme(): Theme {
    if (typeof window === "undefined") return defaultTheme;

    const theme = localStorage.getItem(STORAGE_KEYS.CURRENT_THEME);
    return theme ? JSON.parse(theme) : defaultTheme;
  }

  static saveThemes(themes: Theme[]): void {
    localStorage.setItem(STORAGE_KEYS.THEMES, JSON.stringify(themes));
  }

  static saveCurrentTheme(theme: Theme): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_THEME, JSON.stringify(theme));
  }
}

// Context létrehozása
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider komponens
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [availableThemes, setAvailableThemes] = useState<Theme[]>([
    defaultTheme,
  ]);
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kezdeti betöltés
  useEffect(() => {
    const loadInitialThemes = () => {
      try {
        const savedThemes = ThemeStorage.getThemes();
        const savedCurrentTheme = ThemeStorage.getCurrentTheme();

        setAvailableThemes(savedThemes);
        setCurrentTheme(savedCurrentTheme);
      } catch (err) {
        console.error("Hiba a témák betöltésekor:", err);
        setError("Nem sikerült betölteni a témákat");
      }
    };

    loadInitialThemes();
  }, []);

  // Útvonal változás figyelése
  useEffect(() => {
    const theme = getThemeForRoute(pathname);
    setCurrentTheme(theme);
    ThemeStorage.saveCurrentTheme(theme);
  }, [pathname]);

  // Útvonal alapú téma keresés
  const getThemeForRoute = (path: string): Theme => {
    const matchingTheme = availableThemes.find((theme) =>
      theme.routes?.some((route) => {
        if (route === path) return true;
        if (route.endsWith("/*") && path.startsWith(route.slice(0, -2)))
          return true;
        return false;
      })
    );

    return matchingTheme || defaultTheme;
  };

  // Új téma hozzáadása
  const addTheme = async (theme: Theme) => {
    setIsLoading(true);
    try {
      const newThemes = [...availableThemes, theme];
      setAvailableThemes(newThemes);
      ThemeStorage.saveThemes(newThemes);
    } catch (err) {
      setError("Hiba történt a téma mentése közben");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Téma frissítése
  const updateTheme = async (id: string, updates: Partial<Theme>) => {
    setIsLoading(true);
    try {
      const updatedThemes = availableThemes.map((theme) =>
        theme.id === id ? { ...theme, ...updates } : theme
      );
      setAvailableThemes(updatedThemes);
      ThemeStorage.saveThemes(updatedThemes);

      // Ha az aktuális témát módosítottuk, azt is frissítjük
      if (currentTheme.id === id) {
        const updatedCurrentTheme = { ...currentTheme, ...updates };
        setCurrentTheme(updatedCurrentTheme);
        ThemeStorage.saveCurrentTheme(updatedCurrentTheme);
      }
    } catch (err) {
      setError("Hiba történt a téma frissítése közben");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Téma törlése
  const deleteTheme = async (id: string) => {
    if (id === "default") {
      setError("Az alap témát nem lehet törölni");
      throw new Error("Az alap témát nem lehet törölni");
    }

    setIsLoading(true);
    try {
      const updatedThemes = availableThemes.filter((theme) => theme.id !== id);
      setAvailableThemes(updatedThemes);
      ThemeStorage.saveThemes(updatedThemes);

      // Ha az aktuális témát töröltük, visszaállunk az alapértelmezett témára
      if (currentTheme.id === id) {
        setCurrentTheme(defaultTheme);
        ThemeStorage.saveCurrentTheme(defaultTheme);
      }
    } catch (err) {
      setError("Hiba történt a téma törlése közben");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Sötét/világos mód váltás
  const toggleDarkMode = () => {
    const updatedTheme = {
      ...currentTheme,
      isDark: !currentTheme.isDark,
      colors: {
        ...currentTheme.colors,
        background: !currentTheme.isDark ? "#1C1C1C" : "#FFFFFF",
        textPrimary: !currentTheme.isDark ? "#FFFFFF" : "#000000",
        textSecondary: !currentTheme.isDark ? "#A0AEC0" : "#4A5568",
      },
    };
    setCurrentTheme(updatedTheme);
    ThemeStorage.saveCurrentTheme(updatedTheme);

    if (currentTheme.id !== "default") {
      updateTheme(currentTheme.id, updatedTheme);
    }
  };

  const value = {
    currentTheme,
    setCurrentTheme,
    availableThemes,
    addTheme,
    updateTheme,
    deleteTheme,
    getThemeForRoute,
    toggleDarkMode,
    isLoading,
    error,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// Hook a context használatához
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
