// src/app/admin/page.tsx
"use client";

import { Activity, FileText, Calendar, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const stats = [
    {
      title: "Bejegyzések",
      value: "0",
      description: "Összes bejegyzés",
      icon: FileText,
      color: "bg-blue-500",
      link: "/admin/posts",
    },
    {
      title: "Események",
      value: "0",
      description: "Összes esemény",
      icon: Calendar,
      color: "bg-purple-500",
      link: "/admin/events",
    },
    {
      title: "Üzenetek",
      value: "0",
      description: "Új üzenet",
      icon: MessageSquare,
      color: "bg-green-500",
      link: "/admin/messages",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Vezérlőpult</h1>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">
            Utolsó frissítés: épp most
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Link
            href={stat.link}
            key={stat.title}
            className="block p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.description}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Legutóbbi bejegyzések</h2>
          <p className="text-gray-500 text-sm italic">
            Még nincsenek bejegyzések
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Közelgő események</h2>
          <p className="text-gray-500 text-sm italic">
            Még nincsenek események
          </p>
        </div>
      </div>
    </div>
  );
}
