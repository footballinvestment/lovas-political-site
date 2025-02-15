"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Theme } from "@prisma/client";
import { Plus } from "lucide-react";

export default function ThemeEditorPage() {
  const router = useRouter();
  const params = useParams();
  const themeType = params.type;
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const res = await fetch("/api/themes");
        if (!res.ok) throw new Error("Failed to fetch themes");
        const data = await res.json();
        setThemes(
          data.filter((t: Theme) => t.type === themeType.toUpperCase())
        );
      } catch (error) {
        console.error("Error fetching themes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThemes();
  }, [themeType]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getTypeTitle = (type: string) => {
    const titles = {
      global: "Globális",
      program: "Program",
      news: "Hírek",
      events: "Események",
      categories: "Kategóriák",
    };
    return titles[type as keyof typeof titles] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {getTypeTitle(themeType as string)} Témák
        </h1>
        <button
          onClick={() => router.push(`/admin/themes/${themeType}/new`)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Új téma
        </button>
      </div>

      <div className="grid gap-6">
        {themes.length === 0 ? (
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-gray-600 dark:text-gray-300">
              Még nincsenek témák ebben a kategóriában
            </p>
          </div>
        ) : (
          themes.map((theme) => (
            <div
              key={theme.id}
              className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {theme.name}
              </h2>
              <div className="flex items-center space-x-4">
                <div
                  className="w-20 h-20 rounded"
                  style={{
                    background: `linear-gradient(to right, ${theme.fromColor}, ${theme.toColor})`,
                  }}
                />
                <div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {theme.description}
                  </p>
                  <p
                    className={`text-sm mt-2 ${
                      theme.isActive
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Státusz: {theme.isActive ? "Aktív" : "Inaktív"}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
