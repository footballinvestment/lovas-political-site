"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Slide } from "@prisma/client";

interface EditSlidePageProps {
  params: {
    id: string;
  };
}

export default function EditSlidePage({ params }: EditSlidePageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Slide>>({
    type: "GRADIENT",
    title: "",
    subtitle: "",
    gradientFrom: "",
    gradientTo: "",
    mediaUrl: "",
    ctaText: "",
    ctaLink: "",
    isActive: true,
  });

  useEffect(() => {
    fetchSlide();
  }, [params.id]);

  const fetchSlide = async () => {
    try {
      const response = await fetch(`/api/slides/${params.id}`);
      if (!response.ok) throw new Error("Slide nem található");
      const data = await response.json();
      setFormData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ismeretlen hiba történt");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/slides/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Hiba történt a slide módosításakor");
      }

      router.push("/admin/slides");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ismeretlen hiba történt");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <Link
          href="/admin/slides"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Vissza a listához
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Slide szerkesztése</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-md">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">
            Típus
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, type: e.target.value }))
              }
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            >
              <option value="GRADIENT">Színátmenet</option>
              <option value="IMAGE">Kép</option>
              <option value="VIDEO">Videó</option>
            </select>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Cím
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              required
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Alcím
            <input
              type="text"
              value={formData.subtitle || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, subtitle: e.target.value }))
              }
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            />
          </label>
        </div>

        {formData.type === "GRADIENT" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">
                Kezdő szín
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.gradientFrom || "#000000"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        gradientFrom: e.target.value,
                      }))
                    }
                    className="w-20 h-10"
                  />
                  <input
                    type="text"
                    value={formData.gradientFrom || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        gradientFrom: e.target.value,
                      }))
                    }
                    className="flex-1 rounded-md border border-gray-300 p-2"
                  />
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Záró szín
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.gradientTo || "#000000"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        gradientTo: e.target.value,
                      }))
                    }
                    className="w-20 h-10"
                  />
                  <input
                    type="text"
                    value={formData.gradientTo || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        gradientTo: e.target.value,
                      }))
                    }
                    className="flex-1 rounded-md border border-gray-300 p-2"
                  />
                </div>
              </label>
            </div>

            {/* Előnézet */}
            <div>
              <label className="block text-sm font-medium mb-2">Előnézet</label>
              <div
                className="h-20 rounded-lg"
                style={{
                  background: `linear-gradient(to right, ${formData.gradientFrom}, ${formData.gradientTo})`,
                }}
              />
            </div>
          </>
        )}

        {(formData.type === "IMAGE" || formData.type === "VIDEO") && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Média URL
              <input
                type="text"
                value={formData.mediaUrl || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, mediaUrl: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                required
              />
            </label>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">
            CTA Szöveg
            <input
              type="text"
              value={formData.ctaText || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, ctaText: e.target.value }))
              }
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            CTA Link
            <input
              type="text"
              value={formData.ctaLink || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, ctaLink: e.target.value }))
              }
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            />
          </label>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium">Aktív</span>
          </label>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Mentés..." : "Mentés"}
          </button>
        </div>
      </form>
    </div>
  );
}
