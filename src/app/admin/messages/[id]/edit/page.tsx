"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  User,
  Calendar,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  district: string | null;
  preferredContact: string;
  newsletter: boolean;
  status: "NEW" | "IN_PROGRESS" | "CLOSED";
  createdAt: string;
  updatedAt: string;
};

export default function MessageEditPage() {
  const params = useParams();
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMessage();
  }, []);

  async function fetchMessage() {
    try {
      const response = await fetch(`/api/messages/${params.id}`);
      if (!response.ok) throw new Error("Üzenet betöltése sikertelen");
      const data = await response.json();
      setMessage(data);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ismeretlen hiba történt");
      setIsLoading(false);
    }
  }

  async function handleStatusChange(newStatus: Message["status"]) {
    try {
      const response = await fetch(`/api/messages/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Státusz módosítása sikertelen");
      await fetchMessage();
    } catch (err) {
      alert("Hiba történt a státusz módosítása során");
      console.error(err);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !message) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-800">{error || "Üzenet nem található"}</p>
        <Link
          href="/admin/messages"
          className="mt-2 text-red-600 hover:text-red-800"
        >
          Vissza az üzenetekhez
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigációs sáv az első sorban */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/messages"
          className="text-gray-600 hover:text-gray-900 flex items-center"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Vissza az üzenetekhez
        </Link>
      </div>

      {/* Státusz gombok a második sorban */}
      <div className="flex flex-wrap gap-2">
        {message.status !== "IN_PROGRESS" && (
          <button
            onClick={() => handleStatusChange("IN_PROGRESS")}
            className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Folyamatban
          </button>
        )}
        {message.status !== "CLOSED" && (
          <button
            onClick={() => handleStatusChange("CLOSED")}
            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Lezárás
          </button>
        )}
      </div>

      {/* Tartalom */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Üzenet</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Kapcsolati adatok</h2>
            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <User className="w-5 h-5 mr-2" />
                <span>{message.name}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Mail className="w-5 h-5 mr-2" />
                <a
                  href={`mailto:${message.email}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {message.email}
                </a>
              </div>
              {message.phone && (
                <div className="flex items-center text-gray-600">
                  <Phone className="w-5 h-5 mr-2" />
                  <a
                    href={`tel:${message.phone}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {message.phone}
                  </a>
                </div>
              )}
              {message.district && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span>{message.district}</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">További információk</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Preferált kapcsolat:</span>
                <span className="font-medium">{message.preferredContact}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Hírlevél feliratkozás:</span>
                <span className="font-medium">
                  {message.newsletter ? "Igen" : "Nem"}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Érkezés ideje:</span>
                <span className="font-medium">
                  {new Date(message.createdAt).toLocaleDateString("hu-HU")}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Státusz:</span>
                <span
                  className={`font-medium ${
                    message.status === "NEW"
                      ? "text-blue-600"
                      : message.status === "IN_PROGRESS"
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                >
                  {message.status === "NEW"
                    ? "Új"
                    : message.status === "IN_PROGRESS"
                    ? "Folyamatban"
                    : "Lezárt"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
