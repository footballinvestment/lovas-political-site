"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, Edit, Eye, Palette } from "lucide-react";

interface Theme {
  id: string;
  name: string;
  description: string | null;
  fromColor: string;
  toColor: string;
  textColor: string;
  type: "GLOBAL" | "PROGRAM" | "NEWS" | "EVENTS" | "CATEGORY";
  category: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      const res = await fetch("/api/themes");
      if (!res.ok) throw new Error("Failed to fetch themes");
      const data = await res.json();
      setThemes(data);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ismeretlen hiba történt");
      setIsLoading(false);
    }
  };

  const getTypeLabel = (type: Theme["type"]) => {
    const labels = {
      GLOBAL: "Globális",
      PROGRAM: "Program kártyák",
      NEWS: "Hírek kártyák",
      EVENTS: "Események kártyák",
      CATEGORY: "Program kategória",
    };
    return labels[type];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchThemes}
          className="mt-2 text-red-600 hover:text-red-800"
        >
          Próbálja újra
        </button>
      </div>
    );
  }

  const sections = [
    {
      title: "Globális téma",
      type: "GLOBAL",
      description: "Az oldal általános megjelenését befolyásoló téma",
      href: "/admin/themes/global",
    },
    {
      title: "Program kártyák",
      type: "PROGRAM",
      description: "Program kártyák megjelenésének testreszabása",
      href: "/admin/themes/program",
    },
    {
      title: "Program kategóriák",
      type: "CATEGORY",
      description: "Különböző program kategóriák egyedi megjelenése",
      href: "/admin/themes/categories",
    },
    {
      title: "Hírek kártyák",
      type: "NEWS",
      description: "Hírek megjelenítésének testreszabása",
      href: "/admin/themes/news",
    },
    {
      title: "Események kártyák",
      type: "EVENTS",
      description: "Események megjelenítésének testreszabása",
      href: "/admin/themes/events",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Témák</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => {
          const activeTheme = themes.find(
            (t) => t.type === section.type && t.isActive
          );

          return (
            <Link
              key={section.type}
              href={section.href}
              className="block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <Edit className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-4">{section.description}</p>
              {activeTheme && (
                <div className="mt-4">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded"
                      style={{
                        background: `linear-gradient(to right, ${activeTheme.fromColor}, ${activeTheme.toColor})`,
                      }}
                    />
                    <span className="text-sm text-gray-500">
                      {activeTheme.name}
                    </span>
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
