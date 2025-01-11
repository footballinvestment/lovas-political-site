"use client";

import React from "react";
import HeroSlider from "@/components/slider/HeroSlider";
import EventsSection from "@/components/EventsSection";
import HirekSzekcio from "@/components/HirekSzekcio";
import { Slide } from "@prisma/client";
import Link from "next/link";

interface ClientPageProps {
  slides: Slide[];
}

export default function ClientPage({ slides }: ClientPageProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HeroSlider slides={slides} />

      {/* Program, Események, Kapcsolat kártyák */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Program kártya */}
          <div className="relative bg-gradient-to-br from-[#6DAEF0] to-[#8DEBD1] dark:from-[#4A7BB3] dark:to-[#5EA396] text-white rounded-2xl p-8 hover:shadow-xl transition duration-300">
            <h2 className="text-2xl font-bold mb-4">Programom</h2>
            <p className="mb-6">
              Ismerje meg részletes politikai programomat és terveimet az ország
              fejlesztésére.
            </p>
            <Link
              href="/program"
              className="inline-flex items-center text-lg font-medium bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-all"
            >
              Részletek
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          {/* Események kártya */}
          <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 dark:from-purple-700 dark:to-pink-700 text-white rounded-2xl p-8 hover:shadow-xl transition duration-300">
            <h2 className="text-2xl font-bold mb-4">Események</h2>
            <p className="mb-6">
              Csatlakozzon hozzánk a következő rendezvényeken és mondja el
              véleményét személyesen.
            </p>
            <Link
              href="/esemenyek"
              className="inline-flex items-center text-lg font-medium bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-all"
            >
              Események
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          {/* Kapcsolat kártya */}
          <div className="relative bg-gradient-to-br from-[#6DAEF0] to-[#8DEBD1] dark:from-[#4A7BB3] dark:to-[#5EA396] text-white rounded-2xl p-8 hover:shadow-xl transition duration-300">
            <h2 className="text-2xl font-bold mb-4">Kapcsolat</h2>
            <p className="mb-6">
              Vegye fel velem a kapcsolatot kérdéseivel, javaslataival. Minden
              vélemény számít!
            </p>
            <Link
              href="/kapcsolat"
              className="inline-flex items-center text-lg font-medium bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-all"
            >
              Kapcsolat
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Események szekció */}
      <EventsSection />

      {/* Hírek szekció */}
      <HirekSzekcio />
    </div>
  );
}
