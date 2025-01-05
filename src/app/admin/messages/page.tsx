"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, Edit, Calendar, Mail, Phone, CheckCircle } from "lucide-react";

type ContactStatus = "NEW" | "IN_PROGRESS" | "CLOSED";

interface Message {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  district: string | null;
  preferredContact: string;
  newsletter: boolean;
  status: ContactStatus;
  createdAt: string;
  updatedAt: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch("/api/messages");
      if (!response.ok) throw new Error("Hiba történt a betöltés során");
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ismeretlen hiba történt");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ContactStatus) => {
    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Hiba történt a módosítás során");

      fetchMessages(); // Lista újratöltése
    } catch (err) {
      alert("Hiba történt a státusz módosítása során");
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
          onClick={fetchMessages}
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
        <h1 className="text-2xl font-bold">Beérkezett üzenetek</h1>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            Nincsenek beérkezett üzenetek
          </h3>
          <p className="mt-2 text-gray-600">
            Az űrlapon keresztül beérkezett üzenetek itt fognak megjelenni.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Feladó
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tárgy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Státusz
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Dátum
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Műveletek
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {messages.map((message) => (
                  <tr key={message.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {message.name}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>{message.email}</span>
                        {message.phone && (
                          <>
                            <span className="text-gray-300">|</span>
                            <Phone className="w-4 h-4" />
                            <span>{message.phone}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {message.subject}
                      </div>
                      {message.district && (
                        <div className="text-sm text-gray-500">
                          {message.district}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          message.status === "NEW"
                            ? "bg-blue-100 text-blue-800"
                            : message.status === "IN_PROGRESS"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {message.status === "NEW"
                          ? "Új"
                          : message.status === "IN_PROGRESS"
                          ? "Folyamatban"
                          : "Lezárt"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(message.createdAt).toLocaleDateString("hu-HU")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link
                        href={`/admin/messages/${message.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 bg-blue-100 p-2 rounded-full inline-flex items-center"
                        title="Részletek"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {message.status !== "IN_PROGRESS" && (
                        <button
                          onClick={() =>
                            handleStatusChange(message.id, "IN_PROGRESS")
                          }
                          className="text-yellow-600 hover:text-yellow-900 bg-yellow-100 p-2 rounded-full inline-flex items-center"
                          title="Folyamatban"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                      )}
                      {message.status !== "CLOSED" && (
                        <button
                          onClick={() =>
                            handleStatusChange(message.id, "CLOSED")
                          }
                          className="text-green-600 hover:text-green-900 bg-green-100 p-2 rounded-full inline-flex items-center"
                          title="Lezárás"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
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
