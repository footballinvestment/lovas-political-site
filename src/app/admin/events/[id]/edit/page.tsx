"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import RichTextEditor from "@/components/editor/RichTextEditor";

interface EventData {
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
}

export default function EditEventPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<EventData>({
    title: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    status: "UPCOMING",
  });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${params.id}`);
        if (!response.ok) throw new Error("Esemény nem található");
        const data = await response.json();
        // Dátumok formázása input mezőhöz
        const formattedData = {
          ...data,
          startDate: new Date(data.startDate).toISOString().slice(0, 16),
          endDate: new Date(data.endDate).toISOString().slice(0, 16),
        };
        setFormData(formattedData);
      } catch (error) {
        alert("Hiba történt az esemény betöltése során");
        router.push("/admin/events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/events/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Hiba történt az esemény módosítása során");
      }

      router.push("/admin/events");
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
          href="/admin/events"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="w-4 h-4" />
          Vissza
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Esemény szerkesztése
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl bg-white rounded-xl shadow-sm p-6"
      >
        <div className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Esemény neve
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
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Helyszín
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Kezdés időpontja
              </label>
              <input
                type="datetime-local"
                id="startDate"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Befejezés időpontja
              </label>
              <input
                type="datetime-local"
                id="endDate"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Leírás
            </label>
            <RichTextEditor
              content={formData.description}
              onChange={(content) =>
                setFormData({ ...formData, description: content })
              }
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
              <option value="UPCOMING">Közelgő</option>
              <option value="ONGOING">Folyamatban</option>
              <option value="COMPLETED">Befejezett</option>
              <option value="CANCELLED">Törölt</option>
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href="/admin/events"
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
