"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useThemeColors } from "@/hooks/useThemeColors";

interface Program {
  id: string;
  title: string;
  category: string;
  description: string;
  details: string;
  priority: number;
  status: "tervezett" | "folyamatban" | "megvalositott";
}

const ProgramCards = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const colors = useThemeColors();

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch("/api/program");
        if (!response.ok) {
          throw new Error("Failed to fetch programs");
        }
        const data = await response.json();
        const sortedPrograms = data
          .sort((a: Program, b: Program) => a.priority - b.priority)
          .slice(0, 3);
        setPrograms(sortedPrograms);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="h-64 bg-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24">
        <Card className="bg-gray-900 border-red-600">
          <CardHeader>
            <CardTitle className="text-white">Hiba történt</CardTitle>
            <CardDescription className="text-gray-400">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {programs.map((program, index) => (
          <div
            key={program.id}
            className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-2xl"
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div
              className="absolute inset-0 transition-opacity duration-300"
              style={{
                background: `linear-gradient(to bottom right, ${colors.gradientFrom}, ${colors.gradientTo})`,
                opacity: hoveredCard === index ? 1 : 0.9,
              }}
            />
            <div className="relative p-8">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-white">
                  {program.title}
                </h3>
                {program.status === "folyamatban" && (
                  <span
                    className="px-2 py-1 rounded-full text-xs text-white"
                    style={{ backgroundColor: `${colors.primary}40` }} // 40 az átlátszóság hex értéke
                  >
                    Folyamatban
                  </span>
                )}
              </div>
              <p style={{ color: colors.textSecondary }}>
                {program.description}
              </p>
              <ChevronRight className="h-6 w-6 text-white absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProgramCards;
