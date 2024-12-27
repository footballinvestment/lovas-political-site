// src/components/layout/Header.tsx
"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="backdrop-blur-md bg-white/70 fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link href="/">
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Lovas Zoltán György
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600 transition-colors duration-300 text-lg"
            >
              Kezdőlap
            </Link>
            <Link
              href="/rolam"
              className="text-gray-700 hover:text-blue-600 transition-colors duration-300 text-lg"
            >
              Rólam
            </Link>
            <Link
              href="/program"
              className="text-gray-700 hover:text-blue-600 transition-colors duration-300 text-lg"
            >
              Program
            </Link>
            <Link
              href="/hirek"
              className="text-gray-700 hover:text-blue-600 transition-colors duration-300 text-lg"
            >
              Hírek
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-300"
            >
              Admin
            </Link>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700"
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute w-full bg-white/95 backdrop-blur-md">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className="block px-3 py-2 text-gray-700 hover:text-blue-600"
            >
              Kezdőlap
            </Link>
            <Link
              href="/rolam"
              className="block px-3 py-2 text-gray-700 hover:text-blue-600"
            >
              Rólam
            </Link>
            <Link
              href="/program"
              className="block px-3 py-2 text-gray-700 hover:text-blue-600"
            >
              Program
            </Link>
            <Link
              href="/hirek"
              className="block px-3 py-2 text-gray-700 hover:text-blue-600"
            >
              Hírek
            </Link>
            <Link
              href="/admin"
              className="block px-3 py-2 text-blue-600 font-semibold"
            >
              Admin
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
