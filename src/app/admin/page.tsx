"use client";

import { Activity, FileText, Calendar, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Post {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

interface Event {
  id: string;
  title: string;
  status: string;
  startDate: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState({
    posts: 0,
    events: 0,
    messages: 0,
  });
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Bejegyzések lekérése
        const postsResponse = await fetch("/api/posts");
        const posts = await postsResponse.json();
        setStats((prev) => ({ ...prev, posts: posts.length }));
        setRecentPosts(posts.slice(0, 5)); // Csak az 5 legutóbbi bejegyzés

        // Események lekérése
        const eventsResponse = await fetch("/api/events");
        const events = await eventsResponse.json();
        setStats((prev) => ({ ...prev, events: events.length }));
        setRecentEvents(events.slice(0, 5)); // Csak az 5 legutóbbi esemény
      } catch (error) {
        console.error("Hiba történt az adatok betöltése közben:", error);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      title: "Bejegyzések",
      value: stats.posts,
      description: "Összes bejegyzés",
      icon: FileText,
      color: "bg-blue-500",
      link: "/admin/posts",
    },
    {
      title: "Események",
      value: stats.events,
      description: "Összes esemény",
      icon: Calendar,
      color: "bg-purple-500",
      link: "/admin/events",
    },
    {
      title: "Üzenetek",
      value: stats.messages,
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
        {statCards.map((stat) => (
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
          {recentPosts.length > 0 ? (
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/admin/posts/${post.id}/edit`}
                  className="block p-3 hover:bg-gray-50 rounded-lg"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString("hu-HU")}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        post.status === "PUBLISHED"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {post.status === "PUBLISHED" ? "Publikált" : "Vázlat"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">
              Még nincsenek bejegyzések
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Közelgő események</h2>
          {recentEvents.length > 0 ? (
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/admin/events/${event.id}/edit`}
                  className="block p-3 hover:bg-gray-50 rounded-lg"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(event.startDate).toLocaleDateString("hu-HU")}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        event.status === "UPCOMING"
                          ? "bg-yellow-100 text-yellow-800"
                          : event.status === "ONGOING"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {event.status === "UPCOMING"
                        ? "Közelgő"
                        : event.status === "ONGOING"
                        ? "Folyamatban"
                        : "Befejezett"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">
              Még nincsenek események
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
