import React from "react";
import { Metadata } from "next";
import { getActiveTheme, getGradientStyle } from "@/utils/themes";
import { Calendar, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Események | Lovas Zoltán György",
  description: "Vegyen részt eseményeinken, találkozzunk személyesen!",
};

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
}

async function getEvents() {
  try {
    const res = await fetch("http://localhost:3000/api/events", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Failed to fetch events");
    return await res.json();
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

export default async function EventsPage() {
  const [events, globalTheme, eventsTheme] = await Promise.all([
    getEvents(),
    getActiveTheme("GLOBAL"),
    getActiveTheme("EVENTS"),
  ]);

  return (
    <div className="min-h-screen bg-[#1C1C1C]">
      <div className="relative pt-20" style={getGradientStyle(globalTheme)}>
        <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Események
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Találkozzunk személyesen! Vegyen részt eseményeinken.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="space-y-6">
          {events.map((event: Event) => (
            <div
              key={event.id}
              style={getGradientStyle(eventsTheme)}
              className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-bold text-white mb-2">
                    {event.title}
                  </h2>
                  <div className="flex gap-2">
                    <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">
                      Közelgő
                    </span>
                    <button className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-1 rounded-full transition-all duration-300">
                      Jelentkezés
                    </button>
                  </div>
                </div>
                <p className="text-white/90 mb-4">{event.description}</p>
                <div className="flex items-center space-x-6 text-white/80">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(event.startDate).toLocaleDateString("hu-HU", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              Jelenleg nincsenek meghirdetett események.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
