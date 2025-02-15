"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Undo2, Trash2, Check } from "lucide-react";

interface RouteConfig {
  path: string;
  priority: number;
}

interface Theme {
  id: string;
  name: string;
  description?: string;
  isDark: boolean;
  isActive: boolean;
  colors: {
    gradientFrom: string;
    gradientTo: string;
    background: string;
    textPrimary: string;
    textSecondary: string;
    primary: string;
    secondary: string;
  };
  routes: RouteConfig[];
  createdAt: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditThemePage({ params }: PageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [newRoute, setNewRoute] = useState<RouteConfig>({
    path: "",
    priority: 1,
  });

  // Téma betöltése
  useEffect(() => {
    const loadTheme = () => {
      try {
        // Ideiglenesen localStorage-ból
        const storedThemes = localStorage.getItem("lovas-political-themes");
        const themes = storedThemes ? JSON.parse(storedThemes) : [];
        const foundTheme = themes.find((t: Theme) => t.id === params.id);

        if (!foundTheme) {
          alert("A téma nem található!");
          router.push("/admin/themes");
          return;
        }

        setTheme(foundTheme);
      } catch (error) {
        console.error("Hiba a téma betöltése során:", error);
        alert("Hiba történt a téma betöltése során!");
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme) return;

    setIsSubmitting(true);

    try {
      // Ideiglenesen localStorage-ba mentjük
      const storedThemes = localStorage.getItem("lovas-political-themes");
      const currentThemes = storedThemes ? JSON.parse(storedThemes) : [];

      const updatedThemes = currentThemes.map((t: Theme) =>
        t.id === theme.id ? theme : t
      );

      localStorage.setItem(
        "lovas-political-themes",
        JSON.stringify(updatedThemes)
      );

      router.push("/admin/themes");
      router.refresh();
    } catch (error) {
      alert("Hiba történt a mentés során!");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!theme) return;
    if (theme.id === "default") {
      alert("Az alap témát nem lehet törölni!");
      return;
    }

    if (!confirm("Biztosan törölni szeretné ezt a témát?")) return;

    try {
      const storedThemes = localStorage.getItem("lovas-political-themes");
      const currentThemes = storedThemes ? JSON.parse(storedThemes) : [];

      const updatedThemes = currentThemes.filter(
        (t: Theme) => t.id !== theme.id
      );

      localStorage.setItem(
        "lovas-political-themes",
        JSON.stringify(updatedThemes)
      );

      router.push("/admin/themes");
      router.refresh();
    } catch (error) {
      alert("Hiba történt a törlés során!");
      console.error(error);
    }
  };

  if (isLoading || !theme) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Téma Szerkesztése</h1>
        <div className="space-x-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors inline-flex items-center"
          >
            <Undo2 className="w-5 h-5 mr-2" />
            Vissza
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-red-600 bg-red-100 rounded-md hover:bg-red-200 transition-colors inline-flex items-center"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Törlés
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-flex items-center disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSubmitting ? "Mentés..." : "Mentés"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Alap információk */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Alap Információk</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Téma Neve
              </label>
              <input
                type="text"
                value={theme.name}
                onChange={(e) => setTheme({ ...theme, name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Leírás
              </label>
              <textarea
                value={theme.description}
                onChange={(e) =>
                  setTheme({ ...theme, description: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={theme.isDark}
                  onChange={(e) =>
                    setTheme({ ...theme, isDark: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <label className="text-sm font-medium text-gray-700">
                  Sötét Téma
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={theme.isActive}
                  onChange={(e) =>
                    setTheme({ ...theme, isActive: e.target.checked })
                  }
                  className="rounded border-gray-300"
                  id="isActive"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-gray-700"
                >
                  Aktív Téma
                </label>
                {theme.isActive && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    <Check className="w-3 h-3 mr-1" />
                    Aktív
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Színek */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Színek</h2>

            {/* Gradiens színek */}
            <div className="space-y-4">
              <h3 className="text-md font-medium">Gradiens</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Kezdő Szín
                  </label>
                  <div className="mt-1 flex space-x-2">
                    <input
                      type="color"
                      value={theme.colors.gradientFrom}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          colors: {
                            ...theme.colors,
                            gradientFrom: e.target.value,
                          },
                        })
                      }
                      className="h-10 w-20"
                    />
                    <input
                      type="text"
                      value={theme.colors.gradientFrom}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          colors: {
                            ...theme.colors,
                            gradientFrom: e.target.value,
                          },
                        })
                      }
                      className="flex-1 rounded-md border border-gray-300 px-3"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vég Szín
                  </label>
                  <div className="mt-1 flex space-x-2">
                    <input
                      type="color"
                      value={theme.colors.gradientTo}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          colors: {
                            ...theme.colors,
                            gradientTo: e.target.value,
                          },
                        })
                      }
                      className="h-10 w-20"
                    />
                    <input
                      type="text"
                      value={theme.colors.gradientTo}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          colors: {
                            ...theme.colors,
                            gradientTo: e.target.value,
                          },
                        })
                      }
                      className="flex-1 rounded-md border border-gray-300 px-3"
                    />
                  </div>
                </div>
              </div>
              {/* Gradiens előnézet */}
              <div
                className="h-12 rounded-md"
                style={{
                  background: `linear-gradient(to right, ${theme.colors.gradientFrom}, ${theme.colors.gradientTo})`,
                }}
              />
            </div>

            {/* Háttér és szöveg színek */}
            <div className="space-y-4">
              <h3 className="text-md font-medium">Háttér és Szöveg</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Háttérszín
                  </label>
                  <div className="mt-1 flex space-x-2">
                    <input
                      type="color"
                      value={theme.colors.background}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          colors: {
                            ...theme.colors,
                            background: e.target.value,
                          },
                        })
                      }
                      className="h-10 w-20"
                    />
                    <input
                      type="text"
                      value={theme.colors.background}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          colors: {
                            ...theme.colors,
                            background: e.target.value,
                          },
                        })
                      }
                      className="flex-1 rounded-md border border-gray-300 px-3"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Elsődleges Szövegszín
                  </label>
                  <div className="mt-1 flex space-x-2">
                    <input
                      type="color"
                      value={theme.colors.textPrimary}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          colors: {
                            ...theme.colors,
                            textPrimary: e.target.value,
                          },
                        })
                      }
                      className="h-10 w-20"
                    />
                    <input
                      type="text"
                      value={theme.colors.textPrimary}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          colors: {
                            ...theme.colors,
                            textPrimary: e.target.value,
                          },
                        })
                      }
                      className="flex-1 rounded-md border border-gray-300 px-3"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Másodlagos Szövegszín
                  </label>
                  <div className="mt-1 flex space-x-2">
                    <input
                      type="color"
                      value={theme.colors.textSecondary}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          colors: {
                            ...theme.colors,
                            textSecondary: e.target.value,
                          },
                        })
                      }
                      className="h-10 w-20"
                    />
                    <input
                      type="text"
                      value={theme.colors.textSecondary}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          colors: {
                            ...theme.colors,
                            textSecondary: e.target.value,
                          },
                        })
                      }
                      className="flex-1 rounded-md border border-gray-300 px-3"
                    />
                  </div>
                </div>
              </div>
              {/* Szöveg előnézet */}
              <div
                className="p-4 rounded-md"
                style={{ background: theme.colors.background }}
              >
                <h4 style={{ color: theme.colors.textPrimary }}>
                  Szöveg Előnézet
                </h4>
                <p style={{ color: theme.colors.textSecondary }}>
                  Ez egy példa szöveg a másodlagos színnel.
                </p>
              </div>
            </div>

            {/* Kiegészítő színek */}
            <div className="space-y-4">
              <h3 className="text-md font-medium">Kiegészítő Színek</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Elsődleges Szín
                  </label>
                  <div className="mt-1 flex space-x-2">
                    <input
                      type="color"
                      value={theme.colors.primary}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          colors: { ...theme.colors, primary: e.target.value },
                        })
                      }
                      className="h-10 w-20"
                    />
                    <input
                      type="text"
                      value={theme.colors.primary}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          colors: { ...theme.colors, primary: e.target.value },
                        })
                      }
                      className="flex-1 rounded-md border border-gray-300 px-3"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Másodlagos Szín
                  </label>
                  <div className="mt-1 flex space-x-2">
                    <input
                      type="color"
                      value={theme.colors.secondary}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          colors: {
                            ...theme.colors,
                            secondary: e.target.value,
                          },
                        })
                      }
                      className="h-10 w-20"
                    />
                    <input
                      type="text"
                      value={theme.colors.secondary}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          colors: {
                            ...theme.colors,
                            secondary: e.target.value,
                          },
                        })
                      }
                      className="flex-1 rounded-md border border-gray-300 px-3"
                    />
                  </div>
                </div>
              </div>
              {/* Kiegészítő színek előnézet */}
              <div className="flex gap-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: theme.isDark ? "#000000" : "#FFFFFF",
                  }}
                >
                  Elsődleges Gomb
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-md"
                  style={{
                    backgroundColor: theme.colors.secondary,
                    color: theme.isDark ? "#000000" : "#FFFFFF",
                  }}
                >
                  Másodlagos Gomb
                </button>
              </div>
            </div>
          </div>

          {/* Útvonalak */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Útvonalak</h2>
            <div className="border rounded-md p-4 space-y-4">
              {/* Aktuális útvonalak listája */}
              {theme.routes.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700">
                    Beállított Útvonalak
                  </h3>
                  <div className="space-y-2">
                    {theme.routes
                      .sort((a, b) => b.priority - a.priority)
                      .map((route, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                        >
                          <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium">
                              {route.path}
                            </span>
                            <span className="text-xs text-gray-500">
                              Prioritás: {route.priority}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setTheme({
                                ...theme,
                                routes: theme.routes.filter(
                                  (_, i) => i !== index
                                ),
                              });
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Még nincsenek beállított útvonalak. Használja az alábbi
                  űrlapot új útvonal hozzáadásához.
                </p>
              )}

              {/* Új útvonal hozzáadása */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-700">
                  Új Útvonal Hozzáadása
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Útvonal
                    </label>
                    <input
                      type="text"
                      value={newRoute.path}
                      onChange={(e) =>
                        setNewRoute({ ...newRoute, path: e.target.value })
                      }
                      placeholder="pl: /program vagy /hirek/*"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Prioritás
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newRoute.priority}
                      onChange={(e) =>
                        setNewRoute({
                          ...newRoute,
                          priority: parseInt(e.target.value) || 1,
                        })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Magasabb szám = magasabb prioritás
                    </p>
                  </div>
                </div>

                {/* Súgó szöveg */}
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Tipp:</strong> Használhat wildcard (*) karaktert az
                    útvonal végén, pl: /hirek/* minden hírek aloldalt lefed. Az
                    azonos mintára illeszkedő útvonalak közül a magasabb
                    prioritású érvényesül.
                  </p>
                </div>

                {/* Hozzáadás gomb */}
                <button
                  type="button"
                  onClick={() => {
                    if (!newRoute.path) return;

                    setTheme({
                      ...theme,
                      routes: [...theme.routes, newRoute],
                    });

                    // Form reset
                    setNewRoute({
                      path: "",
                      priority: 1,
                    });
                  }}
                  disabled={!newRoute.path}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Útvonal Hozzáadása
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
