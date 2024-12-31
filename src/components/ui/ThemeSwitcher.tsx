"use client";

import React, { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon, Laptop } from "lucide-react";

type Theme = "light" | "dark" | "system";

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Aktuális ikon meghatározása
  const CurrentIcon = theme === "dark" ? Moon : Sun;

  return (
    <div className="relative">
      {/* Ikon gomb */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-700 dark:text-gray-200 hover:text-[#8DEBD1] transition-colors duration-300"
      >
        <CurrentIcon className="w-5 h-5" />
      </button>

      {/* Dropdown menü */}
      {isOpen && (
        <>
          {/* Overlay a menü bezárásához */}
          <div
            className="fixed inset-0 z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Menü */}
          <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 py-2 min-w-[150px]">
            <button
              onClick={() => {
                setTheme("light");
                setIsOpen(false);
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Sun className="w-4 h-4 mr-2" />
              Világos
            </button>
            <button
              onClick={() => {
                setTheme("dark");
                setIsOpen(false);
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Moon className="w-4 h-4 mr-2" />
              Sötét
            </button>
            <button
              onClick={() => {
                setTheme("system");
                setIsOpen(false);
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Laptop className="w-4 h-4 mr-2" />
              Automatikus
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSwitcher;
