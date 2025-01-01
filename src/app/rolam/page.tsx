"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import NavBar from "@/components/sections/NavBar";

export default function RolamPage() {
  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-white dark:bg-[#1C1C1C]">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 pt-20">
          <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
          <div className="max-w-7xl mx-auto px-4 py-24">
            <div className="text-center relative z-10">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-8">
                Rólam
              </h1>
              <p className="mt-6 text-xl text-blue-100 max-w-3xl mx-auto">
                Elkötelezett vagyok egy jobb, élhetőbb és igazságosabb
                Magyarország megteremtése mellett
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Mission Section */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Célkitűzéseim
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Politikusként és közéleti személyiségként célom, hogy olyan
                változásokat érjek el, amelyek valódi javulást hoznak az emberek
                mindennapi életében. Hiszek abban, hogy a szakértelem és az
                őszinte párbeszéd útján érhetünk el tartós eredményeket.
              </p>
              <div className="grid grid-cols-1 gap-4">
                {[
                  "Átlátható és hatékony közigazgatás",
                  "Versenyképes gazdaságfejlesztés",
                  "Korszerű oktatási lehetőségek",
                  "Minőségi egészségügyi ellátás",
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 text-gray-600 dark:text-gray-300"
                  >
                    <ChevronRight className="h-5 w-5 text-blue-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Values Section */}
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Alapértékeim
              </h2>
              <div className="grid grid-cols-1 gap-6">
                {[
                  {
                    title: "Tisztesség",
                    description:
                      "Munkám során az átláthatóság és a nyílt kommunikáció vezérel.",
                  },
                  {
                    title: "Szakmaiság",
                    description:
                      "Döntéseimet mindig alapos elemzés és szakmai szempontok alapján hozom meg.",
                  },
                  {
                    title: "Közösségi szemlélet",
                    description:
                      "Hiszek abban, hogy a valódi változás csak közösen érhető el.",
                  },
                ].map((value, index) => (
                  <div
                    key={index}
                    className="bg-gray-100 dark:bg-gray-900 p-6 rounded-xl"
                  >
                    <h3 className="text-xl font-semibold text-blue-600 mb-2">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-24 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Vegye fel velem a kapcsolatot!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
              Ha egyetért célkitűzéseimmel vagy megosztaná véleményét, keressen
              bizalommal. Minden építő jellegű párbeszédre nyitott vagyok.
            </p>
            <Link
              href="/kapcsolat"
              className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-all duration-300"
            >
              Kapcsolatfelvétel
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
