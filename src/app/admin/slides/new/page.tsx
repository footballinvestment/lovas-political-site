"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { SlideType } from "@prisma/client";
import { VideoUpload } from "@/components/VideoUpload";
import { ImageUpload } from "@/components/ImageUpload";

export default function NewSlidePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: "GRADIENT" as SlideType,
    title: "",
    subtitle: "",
    gradientFrom: "#6DAEF0",
    gradientTo: "#8DEBD1",
    mediaUrl: "",
    ctaText: "",
    ctaLink: "",
    isActive: true,
    // Új videó mezők alapértékekkel
    videoType: "mp4",
    autoPlay: true,
    isLoop: true,
    isMuted: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/slides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Hiba történt a slide létrehozásakor"
        );
      }

      router.push("/admin/slides");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ismeretlen hiba történt");
    } finally {
      setIsSubmitting(false);
    }
  };

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

      <h1 className="text-2xl font-bold mb-6">Új slide létrehozása</h1>

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
                setFormData((prev) => ({
                  ...prev,
                  type: e.target.value as SlideType,
                }))
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
              value={formData.subtitle}
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
                    value={formData.gradientFrom}
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
                    value={formData.gradientFrom}
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
                    value={formData.gradientTo}
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
                    value={formData.gradientTo}
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

        {formData.type === "IMAGE" && (
          <ImageUpload
            onUpload={(url) =>
              setFormData((prev) => ({ ...prev, mediaUrl: url }))
            }
            currentImage={formData.mediaUrl}
            className="mb-4"
          />
        )}

        {formData.type === "VIDEO" && (
          <div className="space-y-4">
            <VideoUpload
              onUpload={(url, type) => {
                setFormData((prev) => ({
                  ...prev,
                  mediaUrl: url,
                  videoType: type.split("/")[1], // 'video/mp4' -> 'mp4'
                }));
              }}
              currentVideo={formData.mediaUrl}
              className="mb-4"
            />

            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.autoPlay}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      autoPlay: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">
                  Automatikus lejátszás
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isLoop}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isLoop: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">Ismétlés</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isMuted}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isMuted: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">Némítás</span>
              </label>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">
            CTA Szöveg
            <input
              type="text"
              value={formData.ctaText}
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
              value={formData.ctaLink}
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
