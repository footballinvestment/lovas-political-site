"use client";
import React from "react";
import { ArrowRight } from "lucide-react";

interface Hir {
  id: string;
  cim: string;
  tartalom: string;
  publikalasDatuma: string;
}

const HirekSzekcio = () => {
  const [hirek, setHirek] = React.useState<Hir[]>([]);
  const [betoltes, setBetoltes] = React.useState(true);
  const [oldal, setOldal] = React.useState(1);
  const [osszesOldal, setOsszesOldal] = React.useState(1);

  React.useEffect(() => {
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
          "animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white",
      })
    );
  }

  return React.createElement(
    "div",
    { className: "container mx-auto px-4 py-16" },
    [
      React.createElement(
        "h1",
        {
          key: "title",
          className:
            "text-5xl md:text-7xl font-bold text-white mb-4 text-center leading-tight",
        },
        "Hírek és Események"
      ),
      React.createElement(
        "p",
        {
          key: "subtitle",
          className: "mt-4 text-xl text-white/80 max-w-2xl mx-auto text-center",
        },
        "Kövesse nyomon a legfrissebb híreket és eseményeket"
      ),
      React.createElement(
        "div",
        {
          key: "grid",
          className:
            "mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto",
        },
        hirek.map((hir) =>
          React.createElement(
            "div",
            {
              key: hir.id,
              className:
                "relative bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 hover:border-white/30 transition-all duration-300 group",
            },
            [
              React.createElement(
                "div",
                { key: "date", className: "text-sm text-white/70 mb-4" },
                new Date(hir.publikalasDatuma).toLocaleDateString("hu-HU")
              ),
              React.createElement(
                "h2",
                {
                  key: "title",
                  className: "text-2xl font-semibold text-white mb-4",
                },
                hir.cim
              ),
              React.createElement(
                "p",
                { key: "content", className: "text-white/80 mb-6" },
                hir.tartalom
              ),
              React.createElement(
                "a",
                {
                  key: "link",
                  href: `/hirek/${hir.id}`,
                  className:
                    "inline-flex items-center text-white font-medium hover:text-blue-200 group-hover:gap-2 transition-all",
                },
                [
                  "Tovább olvasom",
                  React.createElement(ArrowRight, {
                    key: "arrow",
                    className: "ml-2 h-4 w-4",
                  }),
                ]
              ),
            ]
          )
        )
      ),
      osszesOldal > 1 &&
        React.createElement(
          "div",
          { key: "pagination", className: "flex justify-center gap-4 mt-12" },
          [...Array(osszesOldal)].map((_, i) =>
            React.createElement(
              "button",
              {
                key: i,
                onClick: () => setOldal(i + 1),
                className: `px-6 py-3 rounded-full text-lg font-medium border transition-all duration-300 ${
                  oldal === i + 1
                    ? "text-blue-600 bg-white border-white/30"
                    : "text-white border-white/30 hover:bg-white/10"
                }`,
              },
              i + 1
            )
          )
        ),
    ]
  );
};

export default HirekSzekcio;
