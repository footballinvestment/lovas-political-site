"use client";

import { useState, useEffect } from "react";

interface ThemeColors {
  gradientFrom: string;
  gradientTo: string;
  background: string;
  textPrimary: string;
  textSecondary: string;
  primary: string;
  secondary: string;
}

// Alapértelmezett színek
const defaultColors: ThemeColors = {
  gradientFrom: "#6DAEF0",
  gradientTo: "#8DEBD1",
  background: "#FFFFFF",
  textPrimary: "#1C1C1C",
  textSecondary: "#4B5563",
  primary: "#6DAEF0",
  secondary: "#8DEBD1",
};

export function useThemeColors() {
  const [colors, setColors] = useState<ThemeColors>(defaultColors);

  useEffect(() => {
    const loadTheme = () => {
      try {
        // Aktív téma betöltése a localStorage-ból
        const storedThemes = localStorage.getItem("lovas-political-themes");
        if (storedThemes) {
          const themes = JSON.parse(storedThemes);
          const activeTheme = themes.find((theme: any) => theme.isActive);
          if (activeTheme) {
            setColors(activeTheme.colors);
          }
        }
      } catch (error) {
        console.error("Error loading theme:", error);
        // Hiba esetén maradnak az alapértelmezett színek
      }
    };

    loadTheme();

    // Figyelő hozzáadása a témák változására
    window.addEventListener("storage", loadTheme);
    return () => window.removeEventListener("storage", loadTheme);
  }, []);

  return colors;
}
