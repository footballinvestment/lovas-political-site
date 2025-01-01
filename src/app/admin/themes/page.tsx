// src/app/admin/themes/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, Edit, Trash2, Palette, Eye } from "lucide-react";

interface Theme {
  id: string;
  name: string;
  isDark: boolean;
  isActive: boolean;
  createdAt: string;
  colors: {
    gradientFrom: string;
    gradientTo: string;
    background: string;
    textPrimary: string;
    textSecondary: string;
    primary: string;
    secondary: string;
  };
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
      // Ideiglenesen a localStorage-ból olvassuk
      const storedThemes = localStorage.getItem("lovas-political-themes");
      const themes = storedThemes ? JSON.parse(storedThemes) : [];
      setThemes(themes);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ismeretlen hiba történt");
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (id === "default") {
      alert("Az alap témát nem lehet törölni!");
      return;
    }

    if (!confirm("Biztosan törölni szeretné ezt a témát?")) return;

    try {
      // Ideiglenesen a localStorage-ból töröljük
      const storedThemes = localStorage.getItem("lovas-political-themes");
      const currentThemes = storedThemes ? JSON.parse(storedThemes) : [];
      const updatedThemes = currentThemes.filter(
        (theme: Theme) => theme.id !== id
      );
      localStorage.setItem(
        "lovas-political-themes",
        JSON.stringify(updatedThemes)
      );

      await fetchThemes();
      alert("Téma sikeresen törölve!");
    } catch (err) {
      alert("Hiba történt a törlés során");
      console.error(err);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Témák</h1>
        <Link
          href="/admin/themes/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Új téma
        </Link>
      </div>

      {themes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Palette className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            Nincsenek még egyedi témák
          </h3>
          <p className="mt-2 text-gray-600">
            Hozzon létre egy új témát a "+" gombbal.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Téma neve
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mód
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Státusz
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Létrehozva
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Műveletek
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {themes.map((theme) => (
                  <tr key={theme.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="w-8 h-8 rounded mr-3"
                          style={{
                            background: `linear-gradient(to right, ${theme.colors.gradientFrom}, ${theme.colors.gradientTo})`,
                          }}
                        />
                        <div className="text-sm font-medium text-gray-900">
                          {theme.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          theme.isDark
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {theme.isDark ? "Sötét" : "Világos"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          theme.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {theme.isActive ? "Aktív" : "Inaktív"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(theme.createdAt).toLocaleDateString("hu-HU")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          /* Preview logic */
                        }}
                        className="text-gray-600 hover:text-gray-900 bg-gray-100 p-2 rounded-full inline-flex items-center"
                        title="Előnézet"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/admin/themes/${theme.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 bg-blue-100 p-2 rounded-full inline-flex items-center"
                        title="Szerkesztés"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(theme.id)}
                        className="text-red-600 hover:text-red-900 bg-red-100 p-2 rounded-full inline-flex items-center"
                        title="Törlés"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
