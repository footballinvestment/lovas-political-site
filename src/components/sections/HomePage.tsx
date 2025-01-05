"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import EventsSection from "./EventsSection";

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#1C1C1C]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1] pt-20">
        <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
        <div className="max-w-7xl mx-auto px-4 py-24 sm:py-32 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              <span>Építsük együtt</span>
              <span className="block mt-2">Magyarország jövőjét</span>
            </h1>
            <p className="mt-6 text-xl text-white/90 max-w-2xl mx-auto">
              Modern megoldások, átlátható kormányzás, fenntartható fejlődés
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/program"
                className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-full text-gray-900 bg-white hover:bg-opacity-90 transition-all duration-300"
              >
                Programom megismerése
                <ChevronRight className="ml-2 h-5 w-5" />
              </a>
              <a
                href="/esemenyek"
                className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-full border border-white/30 text-white hover:bg-white/10 transition-all duration-300"
              >
                Események
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Program Cards */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-[#6DAEF0] to-[#8DEBD1] rounded-2xl overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">
                Zöld energia program
              </h3>
              <p className="text-white/90 mb-4">
                A megújuló energiaforrások támogatása és fejlesztése.
              </p>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-white/20 text-white text-sm">
                  folyamatban
                </span>
                <span className="text-white/80 text-sm">Prioritás: 1</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#6DAEF0] to-[#8DEBD1] rounded-2xl overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">
                Energiahatékonysági felújítások
              </h3>
              <p className="text-white/90 mb-4">
                Lakóépületek energetikai korszerűsítése.
              </p>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-white/20 text-white text-sm">
                  folyamatban
                </span>
                <span className="text-white/80 text-sm">Prioritás: 1</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#6DAEF0] to-[#8DEBD1] rounded-2xl overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">
                Egészségügyi modernizáció
              </h3>
              <p className="text-white/90 mb-4">
                Kórházak és rendelők fejlesztése, várólisták csökkentése.
              </p>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-white/20 text-white text-sm">
                  folyamatban
                </span>
                <span className="text-white/80 text-sm">Prioritás: 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Events Section */}
      <EventsSection />
    </div>
  );
};

export default HomePage;
