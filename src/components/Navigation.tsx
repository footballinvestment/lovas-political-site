"use client";
import React from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuItems = [
    { href: "/", text: "Kezdőlap" },
    { href: "/rolam", text: "Rólam" },
    { href: "/program", text: "Program" },
    { href: "/esemenyek", text: "Események" },
    { href: "/hirek", text: "Hírek" },
  ];
  return (
    <nav className="w-full fixed top-0 bg-white/70 backdrop-blur-md z-50 dark:bg-black/70">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-20">
          {/* Logo/Name */}
          <Link
            href="/"
            className="flex items-center text-3xl font-bold bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1] bg-clip-text text-transparent"
          >
            Lovas Zoltán György
          </Link>
          {/* Desktop Menu */}
          <div className="md:flex hidden items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-700 hover:text-[#6DAEF0] dark:text-gray-200 dark:hover:text-[#8DEBD1] transition-colors duration-300"
              >
                {item.text}
              </Link>
            ))}
            <Link
              href="/kapcsolat"
              className="px-6 py-2 bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1] text-white rounded-full hover:shadow-lg transition-all duration-300"
            >
              Kapcsolat
            </Link>
            <ThemeToggle />
          </div>
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            <ThemeToggle />
            <button
              className="text-gray-700 dark:text-gray-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 dark:bg-black/95 backdrop-blur-md">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={`mobile-${item.href}`}
                  href={item.href}
                  className="block px-3 py-2 text-gray-700 hover:text-[#6DAEF0] dark:text-gray-200 dark:hover:text-[#8DEBD1] transition-colors duration-300"
                >
                  {item.text}
                </Link>
              ))}
              <Link
                href="/kapcsolat"
                className="block px-3 py-2 text-[#6DAEF0] dark:text-[#8DEBD1] font-semibold"
              >
                Kapcsolat
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
export default Navigation;
