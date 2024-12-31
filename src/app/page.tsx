import React from "react";
import { ChevronRight } from "lucide-react";
import ProgramCards from "@/components/sections/ProgramCards";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1C1C1C]">
      {/* Navigation */}
      <nav className="backdrop-blur-md bg-black/70 fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <span className="text-3xl font-bold bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1] bg-clip-text text-transparent">
                Mindenki Magyarországa Néppárt
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#"
                className="text-gray-200 hover:text-[#8DEBD1] transition-colors duration-300 text-lg"
              >
                Kezdőlap
              </a>
              <a
                href="#"
                className="text-gray-200 hover:text-[#8DEBD1] transition-colors duration-300 text-lg"
              >
                Rólunk
              </a>
              <a
                href="#"
                className="text-gray-200 hover:text-[#8DEBD1] transition-colors duration-300 text-lg"
              >
                Program
              </a>
              <a
                href="#"
                className="text-gray-200 hover:text-[#8DEBD1] transition-colors duration-300 text-lg"
              >
                Hírek
              </a>
              <a
                href="#"
                className="px-6 py-2 bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1] text-gray-900 rounded-full hover:shadow-lg hover:shadow-[#6DAEF0]/20 transition-all duration-300 text-lg"
              >
                Kapcsolat
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1] pt-20">
        <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
        <div className="max-w-7xl mx-auto px-4 py-24 sm:py-32">
          <div className="text-center relative z-10">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Építsük együtt
              <span className="block">Magyarország jövőjét</span>
            </h1>
            <p className="mt-6 text-xl text-gray-100 max-w-2xl mx-auto">
              Modern megoldások, átlátható kormányzás, fenntartható fejlődés
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#"
                className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-full text-gray-900 bg-white hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
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

      {/* Program Cards Section */}
      <ProgramCards />

      {/* Add more sections here */}
    </div>
  );
}
