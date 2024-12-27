"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events");
        if (!response.ok)
          throw new Error("Hiba történt az események betöltése közben");
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ismeretlen hiba történt"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan törölni szeretné ezt az eseményt?")) return;

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Hiba történt a törlés során");

      setEvents(events.filter((event) => event.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Hiba történt a törlés során");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Események</h1>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Új esemény
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-500">Még nincsenek események</p>
          <Link
            href="/admin/events/new"
            className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4" />
            Hozzon létre egy új eseményt
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Esemény neve
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Időpont
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Helyszín
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Státusz
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Műveletek
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {event.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(event.startDate).toLocaleDateString("hu-HU")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {event.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        event.status === "UPCOMING"
                          ? "bg-yellow-100 text-yellow-800"
                          : event.status === "ONGOING"
                          ? "bg-green-100 text-green-800"
                          : event.status === "COMPLETED"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {event.status === "UPCOMING"
                        ? "Közelgő"
                        : event.status === "ONGOING"
                        ? "Folyamatban"
                        : event.status === "COMPLETED"
                        ? "Befejezett"
                        : "Törölt"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                      Törlés
                    </button>
                    <Link
                      href={`/admin/events/${event.id}/edit`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900"
                    >
                      <Pencil className="w-4 h-4" />
                      Szerkesztés
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
