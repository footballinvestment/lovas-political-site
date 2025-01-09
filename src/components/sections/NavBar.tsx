"use client";
import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function NavBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <nav className="backdrop-blur-md bg-white/70 dark:bg-black/70 fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1] bg-clip-text text-transparent"
            >
              Lovas Zoltán György
            </Link>
          </div>
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-700 dark:text-gray-200 hover:text-[#8DEBD1] transition-colors duration-300 text-lg"
            >
              Kezdőlap
            </Link>
            <Link
              href="/rolam"
              className="text-gray-700 dark:text-gray-200 hover:text-[#8DEBD1] transition-colors duration-300 text-lg"
            >
              Rólam
            </Link>
            <Link
              href="/program"
              className="text-gray-700 dark:text-gray-200 hover:text-[#8DEBD1] transition-colors duration-300 text-lg"
            >
              Program
            </Link>
            <Link
              href="/hirek"
              className="text-gray-700 dark:text-gray-200 hover:text-[#8DEBD1] transition-colors duration-300 text-lg"
            >
              Hírek
            </Link>
            <ThemeToggle />
            <Link
              href="/kapcsolat"
              className="px-6 py-2 bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1] text-gray-900 rounded-full hover:shadow-lg hover:shadow-[#6DAEF0]/20 transition-all duration-300 text-lg"
            >
              Kapcsolat
            </Link>
          </div>
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="ml-4 text-gray-700 dark:text-gray-200"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute w-full bg-white/95 dark:bg-black/95 backdrop-blur-md">
          <div className="px-4 pt-2 pb-3 space-y-2">
            <Link
              href="/"
              className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-[#8DEBD1]"
            >
              Kezdőlap
            </Link>
            <Link
              href="/rolam"
              className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-[#8DEBD1]"
            >
              Rólam
            </Link>
            <Link
              href="/program"
              className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-[#8DEBD1]"
            >
              Program
            </Link>
            <Link
              href="/hirek"
              className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-[#8DEBD1]"
            >
              Hírek
            </Link>
            <Link
              href="/kapcsolat"
              className="block px-3 py-2 text-[#8DEBD1] font-semibold"
            >
              Kapcsolat
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
