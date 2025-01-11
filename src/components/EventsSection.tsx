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
        const filteredEvents = data
          .filter((event: Event) =>
            ["UPCOMING", "ONGOING"].includes(event.status)
          )
          .slice(0, 3);
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
    return React.createElement(
      "div",
      {
        className:
          "py-12 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800",
      },
      React.createElement(
        "div",
        {
          className: "animate-pulse flex justify-center items-center",
        },
        React.createElement("div", {
          className:
            "h-8 w-8 bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1] rounded-full animate-spin",
        })
      )
    );
  }

  if (events.length === 0) {
    return null;
  }

  return React.createElement(
    "section",
    {
      className:
        "relative py-24 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden",
    },
    [
      // Háttér dekoráció
      React.createElement(
        "div",
        { key: "bg-decor", className: "absolute inset-0 overflow-hidden" },
        [
          React.createElement("div", {
            key: "bg-1",
            className:
              "absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-[#6DAEF0]/10 to-[#8DEBD1]/10 transform rotate-12 blur-3xl",
          }),
          React.createElement("div", {
            key: "bg-2",
            className:
              "absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-purple-500/10 to-pink-500/10 transform -rotate-12 blur-3xl",
          }),
        ]
      ),
      // Fő tartalom
      React.createElement(
        "div",
        { key: "main-content", className: "relative max-w-7xl mx-auto px-4" },
        [
          // Fejléc
          React.createElement(
            "div",
            { key: "header", className: "text-center mb-16" },
            [
              React.createElement(
                "h2",
                {
                  key: "title",
                  className:
                    "text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1] bg-clip-text text-transparent mb-4",
                },
                "Közelgő események"
              ),
              React.createElement(
                "p",
                {
                  key: "subtitle",
                  className: "mt-4 text-lg text-gray-600 dark:text-gray-300",
                },
                "Találkozzunk személyesen! Vegyen részt eseményeinken."
              ),
            ]
          ),
          // Események grid
          React.createElement(
            "div",
            {
              key: "events-grid",
              className:
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12",
            },
            events.map((event) =>
              React.createElement(
                "div",
                {
                  key: event.id,
                  className:
                    "group relative rounded-2xl overflow-hidden bg-white dark:bg-gray-800 hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700",
                },
                [
                  React.createElement("div", {
                    key: "overlay",
                    className:
                      "absolute inset-0 bg-gradient-to-br from-[#6DAEF0]/0 to-[#8DEBD1]/0 group-hover:from-[#6DAEF0]/5 group-hover:to-[#8DEBD1]/5 transition-all duration-300",
                  }),
                  React.createElement(
                    "div",
                    { key: "content", className: "relative p-8" },
                    [
                      React.createElement(
                        "div",
                        { key: "header", className: "mb-6" },
                        [
                          React.createElement(
                            "h3",
                            {
                              className:
                                "text-2xl font-bold bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1] bg-clip-text text-transparent mb-3",
                            },
                            event.title
                          ),
                          React.createElement(
                            "p",
                            {
                              className:
                                "text-gray-600 dark:text-gray-300 line-clamp-2",
                            },
                            event.description
                          ),
                        ]
                      ),
                      React.createElement(
                        "div",
                        { key: "meta", className: "space-y-3" },
                        [
                          React.createElement(
                            "div",
                            {
                              key: "date",
                              className:
                                "flex items-center space-x-3 text-gray-500 dark:text-gray-400",
                            },
                            [
                              React.createElement(
                                "div",
                                {
                                  className:
                                    "flex items-center justify-center w-10 h-10 rounded-full bg-[#6DAEF0]/10 dark:bg-[#6DAEF0]/20",
                                },
                                React.createElement(CalendarDays, {
                                  className: "h-5 w-5 text-[#6DAEF0]",
                                })
                              ),
                              React.createElement(
                                "span",
                                { className: "text-sm" },
                                new Date(event.startDate).toLocaleDateString(
                                  "hu-HU",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              ),
                            ]
                          ),
                          React.createElement(
                            "div",
                            {
                              key: "location",
                              className:
                                "flex items-center space-x-3 text-gray-500 dark:text-gray-400",
                            },
                            [
                              React.createElement(
                                "div",
                                {
                                  className:
                                    "flex items-center justify-center w-10 h-10 rounded-full bg-[#8DEBD1]/10 dark:bg-[#8DEBD1]/20",
                                },
                                React.createElement(MapPin, {
                                  className: "h-5 w-5 text-[#8DEBD1]",
                                })
                              ),
                              React.createElement(
                                "span",
                                { className: "text-sm" },
                                event.location
                              ),
                            ]
                          ),
                        ]
                      ),
                    ]
                  ),
                ]
              )
            )
          ),
          // További események gomb
          React.createElement(
            "div",
            { key: "more-events", className: "text-center" },
            React.createElement(
              "a",
              {
                href: "/esemenyek",
                className:
                  "inline-flex items-center px-8 py-4 text-lg font-medium rounded-full bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1] text-white hover:shadow-lg hover:shadow-[#6DAEF0]/20 dark:hover:shadow-[#6DAEF0]/10 transform hover:translate-y-[-2px] transition-all duration-300",
              },
              [
                "További események",
                React.createElement(ChevronRight, {
                  key: "icon",
                  className: "ml-2 h-5 w-5",
                }),
              ]
            )
          ),
        ]
      ),
    ]
  );
};

export default EventsSection;
