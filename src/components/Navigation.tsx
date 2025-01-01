"use client";
import React from "react";
import { Menu, X } from "lucide-react";
import { UserButton } from "@/components/auth/UserButton";
import Link from "next/link";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const menuItems = [
    { href: "/", text: "Kezdőlap" },
    { href: "/rolam", text: "Rólam" },
    { href: "/program", text: "Program" },
    { href: "/hirek", text: "Hírek" },
  ];

  return (
    <nav className="w-full fixed top-0 bg-white/70 backdrop-blur-md z-50 dark:bg-black/70">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-20">
          <Link href="/" className="text-3xl font-bold flex items-center">
            Lovas Zoltán György
          </Link>

          <div className="md:flex hidden items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-700 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400"
              >
                {item.text}
              </Link>
            ))}
            <Link
              href="/kapcsolat"
              className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              Kapcsolat
            </Link>
            <UserButton />
          </div>

          <button
            className="md:hidden text-gray-700 dark:text-gray-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-black">
            {menuItems.map((item) => (
              <Link
                key={`mobile-${item.href}`}
                href={item.href}
                className="block px-4 py-2 text-gray-700 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400"
              >
                {item.text}
              </Link>
            ))}
            <Link
              href="/kapcsolat"
              className="block px-4 py-2 text-blue-500 font-semibold"
            >
              Kapcsolat
            </Link>
            <div className="px-4 py-2">
              <UserButton />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
