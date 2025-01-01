"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Calendar,
  Home,
  Palette, // Új ikon a témákhoz
  LogOut,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const menuItems = [
    {
      title: "Kezdőlap",
      href: "/admin",
      icon: Home,
    },
    {
      title: "Bejegyzések",
      href: "/admin/posts",
      icon: FileText,
    },
    {
      title: "Események",
      href: "/admin/events",
      icon: Calendar,
    },
    {
      title: "Témák", // Új menüpont
      href: "/admin/themes",
      icon: Palette,
    },
  ];

  const isActive = (path: string) => {
    return pathname?.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Oldalsó menü */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6">
            <Link
              href="/"
              className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Admin Panel
            </Link>
          </div>

          {/* Menü elemek */}
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm rounded-lg ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* Kijelentkezés */}
          <div className="p-4 border-t">
            <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50">
              <LogOut className="w-5 h-5 mr-3" />
              Kijelentkezés
            </button>
          </div>
        </div>
      </aside>

      {/* Fő tartalom */}
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}
