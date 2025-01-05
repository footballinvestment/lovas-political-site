"use client";

import React, { useEffect, useState } from "react";
import { CalendarDays, MapPin, ChevronRight } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
  imageUrl?: string;
}

const EventsSection = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Failed to fetch events");
        const data = await res.json();
        // Csak az UPCOMING és ONGOING eseményeket jelenítjük meg
        const filteredEvents = data
          .filter((event: Event) =>
            ["UPCOMING", "ONGOING"].includes(event.status)
          )
          .slice(0, 3); // Maximum 3 esemény
        setEvents(filteredEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return <div className="py-12 bg-gray-50 dark:bg-gray-900">Betöltés...</div>;
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Közelgő események
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Találkozzunk személyesen! Vegyen részt eseményeinken.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {event.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {event.description}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <CalendarDays className="h-5 w-5 mr-2" />
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
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a
            href="/esemenyek"
            className="inline-flex items-center px-6 py-3 text-lg font-medium rounded-full bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1] text-white hover:shadow-lg transition-all duration-300"
          >
            További események
            <ChevronRight className="ml-2 h-5 w-5" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
