// src/app/admin/posts/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import RichTextEditor from "@/components/editor/RichTextEditor";

interface PostData {
  title: string;
  content: string;
  status: string;
}

export default function EditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<PostData>({
    title: "",
    content: "",
    status: "DRAFT",
  });

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${params.id}`);
        if (!response.ok) throw new Error("Bejegyzés nem található");
        const data = await response.json();
        setFormData(data);
      } catch (error) {
        alert("Hiba történt a bejegyzés betöltése során");
        router.push("/admin/posts");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/posts/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Hiba történt a bejegyzés módosítása során");
      }

      router.push("/admin/posts");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Hiba történt");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/posts"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="w-4 h-4" />
          Vissza
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Bejegyzés szerkesztése
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-4xl bg-white rounded-xl shadow-sm p-6"
      >
        <div className="space-y-6">
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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tartalom
            </label>
            <RichTextEditor
              content={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
            />
          </div>

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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="DRAFT">Vázlat</option>
              <option value="PUBLISHED">Publikált</option>
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href="/admin/posts"
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Mégse
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Mentés..." : "Mentés"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
