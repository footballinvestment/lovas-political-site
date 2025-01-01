// src/app/admin/posts/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Eye, ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import { ImageUpload } from "@/components/ImageUpload";

const RichTextEditor = dynamic(
  () => import("@/components/editor/RichTextEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full bg-gray-100 animate-pulse rounded-md" />
    ),
  }
);

interface PostData {
  title: string;
  content: string;
  imageUrl: string;
  status: string;
}

export default function EditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PostData>({
    title: "",
    content: "",
    imageUrl: "",
    status: "DRAFT",
  });

  // Bejegyzés betöltése
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${params.id}`);
        if (!response.ok) throw new Error("Hiba történt a betöltés során");
        const data = await response.json();
        setFormData(data);
      } catch (error) {
        console.error("Hiba:", error);
        alert("Hiba történt a bejegyzés betöltése során!");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/posts/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Hiba történt a mentés során");
      }

      alert("Bejegyzés sikeresen módosítva!");
      router.push("/admin/posts");
    } catch (error) {
      console.error("Hiba:", error);
      alert("Hiba történt a mentés során!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Vissza
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Bejegyzés szerkesztése</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cím */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Cím
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full p-2 border rounded-md"
              placeholder="Add meg a bejegyzés címét"
              required
            />
          </div>

          {/* Borítókép feltöltés */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Borítókép
            </label>
            <ImageUpload
              onUpload={(url) => setFormData({ ...formData, imageUrl: url })}
              currentImage={formData.imageUrl}
            />
          </div>

          {/* Tartalom szerkesztő */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tartalom
            </label>
            <RichTextEditor
              content={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
            />
          </div>

          {/* Státusz */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Státusz
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="DRAFT">Vázlat</option>
              <option value="PUBLISHED">Publikált</option>
              <option value="ARCHIVED">Archivált</option>
            </select>
          </div>

          {/* Gombok */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => {
                const previewContent = `
                  <html>
                    <head>
                      <title>${formData.title} - Előnézet</title>
                      <style>
                        body { font-family: system-ui; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
                        img { max-width: 100%; height: auto; }
                      </style>
                    </head>
                    <body>
                      <h1>${formData.title}</h1>
                      ${
                        formData.imageUrl
                          ? `<img src="${formData.imageUrl}" alt="${formData.title}" />`
                          : ""
                      }
                      ${formData.content}
                    </body>
                  </html>
                `;
                const previewWindow = window.open();
                previewWindow?.document.write(previewContent);
                previewWindow?.document.close();
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Eye className="w-4 h-4 mr-2" />
              Előnézet
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Mentés..." : "Módosítás"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
