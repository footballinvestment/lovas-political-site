// src/app/admin/layout.tsx
import { LayoutDashboard, FileText, Calendar, Mail } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    {
      title: "Vezérlőpult",
      href: "/admin",
      icon: LayoutDashboard,
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
      title: "Üzenetek",
      href: "/admin/messages",
      icon: Mail,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Oldalsáv */}
        <div className="w-64 min-h-screen bg-white shadow-lg">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
          </div>
          <nav className="px-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700"
              >
                <item.icon className="w-5 h-5" />
                {item.title}
              </Link>
            ))}
          </nav>
        </div>

        {/* Fő tartalom */}
        <div className="flex-1 p-8">{children}</div>
      </div>
    </div>
  );
}
