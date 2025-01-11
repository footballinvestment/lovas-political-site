"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

interface Hir {
  id: string;
  cim: string;
  tartalom: string;
  publikalasDatuma: string;
}

const HirekSzekcio = () => {
  const [hirek, setHirek] = useState<Hir[]>([]);
  const [betoltes, setBetoltes] = useState(true);
  const [oldal, setOldal] = useState(1);
  const [osszesOldal, setOsszesOldal] = useState(1);

  useEffect(() => {
    const hirekBetoltese = async () => {
      try {
        const valasz = await fetch(`/api/hirek?oldal=${oldal}&limit=6`);
        const adat = await valasz.json();
        setHirek(adat.data);
        setOsszesOldal(adat.pagination.totalPages);
      } catch (hiba) {
        console.error("Hiba történt a hírek betöltésekor:", hiba);
      } finally {
        setBetoltes(false);
      }
    };

    hirekBetoltese();
  }, [oldal]);

  if (betoltes) {
    return React.createElement(
      "div",
      { className: "flex justify-center items-center min-h-[50vh]" },
      React.createElement("div", {
        className:
          "h-8 w-8 bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1] rounded-full animate-spin",
      })
    );
  }

  return React.createElement(
    "div",
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
              "absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-br from-[#6DAEF0]/5 to-[#8DEBD1]/5 blur-3xl transform rotate-45",
          }),
          React.createElement("div", {
            key: "bg-2",
            className:
              "absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-purple-500/5 to-pink-500/5 blur-3xl transform -rotate-45",
          }),
        ]
      ),
      // Fő tartalom konténer
      React.createElement(
        "div",
        { key: "container", className: "container relative mx-auto px-4" },
        [
          // Fejléc
          React.createElement(
            "h1",
            {
              key: "title",
              className:
                "text-5xl md:text-7xl font-bold bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1] bg-clip-text text-transparent mb-4 text-center leading-tight",
            },
            "Hírek és Események"
          ),
          React.createElement(
            "p",
            {
              key: "subtitle",
              className:
                "mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-center",
            },
            "Kövesse nyomon a legfrissebb híreket és eseményeket"
          ),
          // Hírek grid
          React.createElement(
            "div",
            {
              key: "grid",
              className:
                "mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto",
            },
            hirek.map((hir) =>
              React.createElement(
                "div",
                {
                  key: hir.id,
                  className:
                    "group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden",
                },
                [
                  // Dátum sáv
                  React.createElement(
                    "div",
                    {
                      key: "date",
                      className:
                        "inline-block px-4 py-2 rounded-full bg-gradient-to-r from-[#6DAEF0]/10 to-[#8DEBD1]/10 dark:from-[#6DAEF0]/20 dark:to-[#8DEBD1]/20 text-sm text-gray-600 dark:text-gray-300 mb-4",
                    },
                    new Date(hir.publikalasDatuma).toLocaleDateString("hu-HU")
                  ),
                  // Cím
                  React.createElement(
                    "h2",
                    {
                      key: "title",
                      className:
                        "text-2xl font-bold bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1] bg-clip-text text-transparent mb-4 group-hover:scale-[1.01] transform transition-transform duration-300",
                    },
                    hir.cim
                  ),
                  // Tartalom
                  React.createElement(
                    "p",
                    {
                      key: "content",
                      className: "text-gray-600 dark:text-gray-300 mb-6",
                    },
                    hir.tartalom
                  ),
                  // Link
                  React.createElement(
                    "a",
                    {
                      key: "link",
                      href: `/hirek/${hir.id}`,
                      className:
                        "inline-flex items-center space-x-2 text-[#6DAEF0] dark:text-[#8DEBD1] font-medium group-hover:translate-x-1 transition-transform duration-300",
                    },
                    [
                      "Tovább olvasom",
                      React.createElement(ArrowRight, {
                        key: "arrow",
                        className:
                          "ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300",
                      }),
                    ]
                  ),
                  // Hover gradiens overlay
                  React.createElement("div", {
                    key: "overlay",
                    className:
                      "absolute inset-0 bg-gradient-to-br from-[#6DAEF0]/0 to-[#8DEBD1]/0 group-hover:from-[#6DAEF0]/5 group-hover:to-[#8DEBD1]/5 transition-all duration-300 pointer-events-none",
                  }),
                ]
              )
            )
          ),
          // Lapozó
          osszesOldal > 1 &&
            React.createElement(
              "div",
              {
                key: "pagination",
                className: "flex justify-center gap-4 mt-12",
              },
              [...Array(osszesOldal)].map((_, i) =>
                React.createElement(
                  "button",
                  {
                    key: i,
                    onClick: () => setOldal(i + 1),
                    className: `px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 ${
                      oldal === i + 1
                        ? "bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1] text-white shadow-lg"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`,
                  },
                  i + 1
                )
              )
            ),
        ]
      ),
    ]
  );
};

export default HirekSzekcio;
