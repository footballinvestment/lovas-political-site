import React from "react";
import { Metadata } from "next";
import {
  getActiveTheme,
  getActiveThemeByCategory,
  getGradientStyle,
} from "@/utils/themes";
import { generatePageMetadata } from "@/lib/seo";
import { ProgramPointStructuredData } from "@/components/seo/StructuredData";

export const metadata = generatePageMetadata(
  "Politikai Program",
  "Ismerje meg részletes politikai programunkat és terveinket az ország fejlesztésére. Modern megoldások a környezetvédelem, oktatás, egészségügy és szociális ügyek területén.",
  "/program",
  {
    keywords: "politikai program, Lovas Zoltán György, környezetvédelem, oktatás, egészségügy, szociális ügyek",
    image: "/images/og-program.jpg",
  }
);

interface ProgramPoint {
  id: string;
  title: string;
  category: string;
  description: string;
  details: string;
  priority: number;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
  createdAt: string;
  updatedAt: string;
}

async function getProgramPoints() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/program`, {
      next: { revalidate: 3600 },
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch program points: ${res.status}`);
    }
    
    const response = await res.json();
    // Handle the new API response structure
    return response.data || response || [];
  } catch (error) {
    console.error("Error fetching program points:", error);
    return [];
  }
}

async function getCategoryThemes(categories: string[]) {
  const themes = await Promise.all(
    categories.map(async (category) => {
      const theme = await getActiveThemeByCategory(category);
      return [category, theme];
    })
  );
  return Object.fromEntries(themes);
}

export default async function ProgramPage() {
  const [programPoints, globalTheme, programTheme] = await Promise.all([
    getProgramPoints(),
    getActiveTheme("GLOBAL"),
    getActiveTheme("PROGRAM"),
  ]);

  const groupedPrograms = programPoints.reduce(
    (acc: Record<string, ProgramPoint[]>, point: ProgramPoint) => {
      if (!acc[point.category]) {
        acc[point.category] = [];
      }
      acc[point.category].push(point);
      return acc;
    },
    {}
  );

  const categoryThemes = await getCategoryThemes(Object.keys(groupedPrograms));

  return (
    <>
      {/* Structured Data for Program Points */}
      {Object.entries(groupedPrograms).map(([category, points]) =>
        points.map((point) => (
          <ProgramPointStructuredData
            key={point.id}
            headline={point.title}
            description={point.description}
            datePublished={new Date().toISOString()}
            url={`/program#${point.id}`}
            category={category}
          />
        ))
      )}
      
      <div className="min-h-screen bg-[#1C1C1C]">
        <div className="relative pt-20" style={getGradientStyle(globalTheme)}>
          <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
          <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24 relative z-10">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Programunk
              </h1>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Modern megoldások egy igazságosabb, élhetőbb Magyarországért
              </p>
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {Object.entries(groupedPrograms).length > 0 ? (
          Object.entries(groupedPrograms).map(([category, points]) => {
            const theme = categoryThemes[category] || programTheme;

            return (
              <div key={category} className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-8 pl-4 border-l-4 border-[#8DEBD1]">
                  {category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {points.map((point) => (
                    <div
                      key={point.id}
                      className="rounded-2xl overflow-hidden relative transition-all duration-300 hover:-translate-y-1"
                      style={getGradientStyle(theme)}
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold">{point.title}</h3>
                          <span className="ml-4 px-3 py-1 rounded-full bg-white/20">
                            {point.status === "PLANNED" ? "Tervezett" : 
                             point.status === "IN_PROGRESS" ? "Folyamatban" :
                             point.status === "COMPLETED" ? "Megvalósítva" : 
                             point.status === "ON_HOLD" ? "Felfüggesztve" : point.status}
                          </span>
                        </div>
                        <p className="mb-4 opacity-90">{point.description}</p>
                        <div className="flex items-center mt-auto">
                          <span className="opacity-80 text-sm">
                            Prioritás: {point.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-400 py-12">
            Programpontok betöltése sikertelen. Kérjük, próbálja újra később.
          </div>
        )}
      </div>
    </div>
    </>
  );
}
