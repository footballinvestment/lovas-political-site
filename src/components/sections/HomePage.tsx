// src/components/sections/HomePage.tsx
"use client";

import React from "react";
import { Menu, X, ChevronRight } from "lucide-react";

const HomePage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return React.createElement(
    "div",
    { className: "min-h-screen bg-white dark:bg-gray-900" },
    [
      // Navigation
      React.createElement(
        "nav",
        {
          className:
            "fixed w-full bg-white/70 dark:bg-black/70 backdrop-blur-md z-50",
          key: "nav",
        },
        React.createElement(
          "div",
          { className: "max-w-7xl mx-auto px-4" },
          React.createElement(
            "div",
            { className: "flex justify-between h-20 items-center" },
            [
              // Logo
              React.createElement(
                "span",
                {
                  className: "text-3xl font-bold text-gray-900 dark:text-white",
                  key: "logo",
                },
                "Lovas Zoltán György"
              ),
              // Desktop Menu
              React.createElement(
                "div",
                {
                  className: "hidden md:flex items-center space-x-8",
                  key: "desktop-menu",
                },
                [
                  ...["Kezdőlap", "Rólam", "Program", "Hírek"].map((item) =>
                    React.createElement(
                      "a",
                      {
                        key: item,
                        href: "#",
                        className:
                          "text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300",
                      },
                      item
                    )
                  ),
                  React.createElement(
                    "a",
                    {
                      key: "contact",
                      href: "#",
                      className:
                        "px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-300",
                    },
                    "Kapcsolat"
                  ),
                ]
              ),
              // Mobile Menu Button
              React.createElement(
                "button",
                {
                  key: "mobile-menu-button",
                  className: "md:hidden text-gray-900 dark:text-white",
                  onClick: () => setIsMenuOpen(!isMenuOpen),
                },
                React.createElement(isMenuOpen ? X : Menu, { size: 24 })
              ),
            ]
          )
        )
      ),

      // Mobile Menu
      isMenuOpen &&
        React.createElement(
          "div",
          {
            className:
              "md:hidden fixed top-20 inset-x-0 bg-white/90 dark:bg-black/90 backdrop-blur-md z-40",
            key: "mobile-menu",
          },
          React.createElement(
            "div",
            { className: "px-2 pt-2 pb-3 space-y-1" },
            [
              ...["Kezdőlap", "Rólam", "Program", "Hírek"].map((item) =>
                React.createElement(
                  "a",
                  {
                    key: item,
                    href: "#",
                    className:
                      "block px-3 py-2 text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300",
                  },
                  item
                )
              ),
              React.createElement(
                "a",
                {
                  key: "mobile-contact",
                  href: "#",
                  className: "block px-3 py-2 text-blue-600 dark:text-blue-400",
                },
                "Kapcsolat"
              ),
            ]
          )
        ),

      // Hero Section
      React.createElement(
        "section",
        {
          className:
            "relative min-h-screen flex items-center justify-center pt-20",
          style: {
            background:
              "linear-gradient(135deg, rgb(67, 56, 202) 10%, rgb(79, 70, 229) 50%, rgb(14, 165, 233) 90%)",
          },
          key: "hero",
        },
        React.createElement(
          "div",
          { className: "max-w-7xl mx-auto px-4 py-24 sm:py-32" },
          React.createElement("div", { className: "text-center" }, [
            React.createElement(
              "h1",
              {
                className:
                  "text-5xl md:text-7xl font-bold text-white leading-tight",
                key: "title",
              },
              [
                React.createElement(
                  "span",
                  { key: "title-1" },
                  "Építsük együtt a"
                ),
                React.createElement(
                  "span",
                  { key: "title-2", className: "block mt-2" },
                  "jövő Magyarországát"
                ),
              ]
            ),
            React.createElement(
              "p",
              {
                className: "mt-6 text-xl text-white/90 max-w-2xl mx-auto",
                key: "subtitle",
              },
              "Modern megoldások, átlátható kormányzás, fenntartható fejlődés"
            ),
            React.createElement(
              "div",
              {
                className:
                  "mt-10 flex flex-col sm:flex-row gap-4 justify-center",
                key: "cta-buttons",
              },
              [
                React.createElement(
                  "a",
                  {
                    key: "cta-primary",
                    href: "#",
                    className:
                      "inline-flex items-center px-8 py-4 text-lg font-medium rounded-full bg-white hover:bg-opacity-90 transition-all duration-300",
                  },
                  [
                    "Programom megismerése",
                    React.createElement(ChevronRight, {
                      className: "ml-2 h-5 w-5",
                      key: "arrow",
                    }),
                  ]
                ),
                React.createElement(
                  "a",
                  {
                    key: "cta-secondary",
                    href: "#",
                    className:
                      "inline-flex items-center px-8 py-4 text-lg font-medium rounded-full border border-white/30 text-white hover:bg-white/10 transition-all duration-300",
                  },
                  "Események"
                ),
              ]
            ),
          ])
        )
      ),
    ]
  );
};

export default HomePage;
