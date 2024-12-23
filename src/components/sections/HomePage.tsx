"use client";

import React from "react";
import {
  Menu,
  X,
  ChevronRight,
  Facebook,
  Twitter,
  Instagram,
} from "lucide-react";

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [hoveredCard, setHoveredCard] = React.useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="backdrop-blur-md bg-white/70 fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Lovas Zoltán György
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#"
                className="text-gray-700 hover:text-blue-600 transition-colors duration-300 text-lg"
              >
                Kezdőlap
              </a>
              <a
                href="#"
                className="text-gray-700 hover:text-blue-600 transition-colors duration-300 text-lg"
              >
                Rólam
              </a>
              <a
                href="#"
                className="text-gray-700 hover:text-blue-600 transition-colors duration-300 text-lg"
              >
                Program
              </a>
              <a
                href="#"
                className="text-gray-700 hover:text-blue-600 transition-colors duration-300 text-lg"
              >
                Hírek
              </a>
              <a
                href="#"
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:shadow-lg transition-all duration-300 text-lg"
              >
                Kapcsolat
              </a>
            </div>

            {/* Mobile menu button */}
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

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute w-full bg-white/95 backdrop-blur-md">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a
                href="#"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600"
              >
                Kezdőlap
              </a>
              <a
                href="#"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600"
              >
                Rólam
              </a>
              <a
                href="#"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600"
              >
                Program
              </a>
              <a
                href="#"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600"
              >
                Hírek
              </a>
              <a
                href="#"
                className="block px-3 py-2 text-blue-600 font-semibold"
              >
                Kapcsolat
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 pt-20">
        <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
        <div className="max-w-7xl mx-auto px-4 py-24 sm:py-32">
          <div className="text-center relative z-10">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Építsük együtt a
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
                jövő Magyarországát
              </span>
            </h1>
            <p className="mt-6 text-xl text-blue-100 max-w-2xl mx-auto">
              Modern megoldások, átlátható kormányzás, fenntartható fejlődés
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#"
                className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-full text-blue-600 bg-white hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Programom megismerése
                <ChevronRight className="ml-2 h-5 w-5" />
              </a>
              <a
                href="#"
                className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-full text-white border-2 border-white/30 hover:bg-white/10 transition-all duration-300"
              >
                Események
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Programom",
              description:
                "Ismerje meg részletes politikai programomat és terveimet az ország fejlesztésére.",
              color: "from-blue-500 to-blue-600",
            },
            {
              title: "Események",
              description:
                "Csatlakozzon hozzánk a következő rendezvényeken és mondja el véleményét személyesen.",
              color: "from-purple-500 to-purple-600",
            },
            {
              title: "Kapcsolat",
              description:
                "Vegye fel velem a kapcsolatot kérdéseivel, javaslataival. Minden vélemény számít!",
              color: "from-indigo-500 to-indigo-600",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-2xl"
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${
                  item.color
                } opacity-${
                  hoveredCard === index ? "100" : "90"
                } transition-opacity duration-300`}
              />
              <div className="relative p-8">
                <h3 className="text-2xl font-bold text-white mb-4">
                  {item.title}
                </h3>
                <p className="text-white/90">{item.description}</p>
                <ChevronRight className="h-6 w-6 text-white absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Latest News Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
          Legfrissebb Hírek
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="h-48 bg-gray-200" />
              <div className="p-6">
                <p className="text-blue-600 text-sm mb-2">
                  2024. március {item}.
                </p>
                <h3 className="text-xl font-semibold mb-2">
                  Közösségi fejlesztések {item}
                </h3>
                <p className="text-gray-600 mb-4">
                  Új kezdeményezések a helyi közösségek támogatására...
                </p>
                <a
                  href="#"
                  className="text-blue-600 font-medium hover:text-blue-700 transition-colors duration-300"
                >
                  Tovább olvasom →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-white/90 mb-4 md:mb-0 text-lg">
              © 2024 Lovas Zoltán György. Minden jog fenntartva.
            </div>
            <div className="flex space-x-8">
              <Facebook className="h-6 w-6 text-white/90 hover:text-blue-400 cursor-pointer transition-colors duration-300" />
              <Twitter className="h-6 w-6 text-white/90 hover:text-blue-400 cursor-pointer transition-colors duration-300" />
              <Instagram className="h-6 w-6 text-white/90 hover:text-purple-400 cursor-pointer transition-colors duration-300" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
