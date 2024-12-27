// src/app/admin/posts/page.tsx
"use client";

import { useState } from "react";
import { PlusIcon, ChevronLeftIcon } from "lucide-react";
import Link from "next/link";

export default function PostsPage() {
  const [posts, setPosts] = useState([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-800">
                <ChevronLeftIcon size={24} />
              </Link>
              <h1 className="text-2xl font-bold">Bejegyzések kezelése</h1>
            </div>

            <Link
              href="/admin/posts/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon size={20} />
              Új bejegyzés
            </Link>
          </div>

          {/* Bejegyzések listája */}
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 pl-4">Cím</th>
                  <th className="pb-3">Státusz</th>
                  <th className="pb-3">Létrehozva</th>
                  <th className="pb-3">Műveletek</th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      Még nincsenek bejegyzések. Hozzon létre egyet az "Új
                      bejegyzés" gombbal!
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className="border-b">
                      <td className="py-4 pl-4">{post.title}</td>
                      <td className="py-4">{post.status}</td>
                      <td className="py-4">
                        {new Date(post.createdAt).toLocaleDateString("hu-HU")}
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button className="text-blue-600 hover:text-blue-800">
                            Szerkesztés
                          </button>
                          <button className="text-red-600 hover:text-red-800">
                            Törlés
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
