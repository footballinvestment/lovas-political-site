"use client";

import React from "react";
import { Menu, X } from "lucide-react";
import { UserButton } from "@/components/auth/UserButton";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return React.createElement(
    "nav",
    { className: "w-full fixed top-0 bg-white/70 backdrop-blur-md z-50" },
    React.createElement("div", { className: "max-w-7xl mx-auto px-4" }, [
      React.createElement(
        "div",
        { className: "flex justify-between h-20", key: "header" },
        [
          React.createElement(
            "span",
            {
              className:
                "text-3xl font-bold flex items-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent",
              key: "logo",
            },
            "Lovas Zoltán György"
          ),
          React.createElement(
            "div",
            {
              className: "md:flex hidden items-center space-x-8",
              key: "desktop-menu",
            },
            [
              React.createElement(
                "a",
                {
                  href: "/",
                  className: "text-gray-700 hover:text-blue-600",
                  key: "home",
                },
                "Kezdőlap"
              ),
              React.createElement(
                "a",
                {
                  href: "/about",
                  className: "text-gray-700 hover:text-blue-600",
                  key: "about",
                },
                "Rólam"
              ),
              React.createElement(
                "a",
                {
                  href: "/program",
                  className: "text-gray-700 hover:text-blue-600",
                  key: "program",
                },
                "Program"
              ),
              React.createElement(
                "a",
                {
                  href: "/news",
                  className: "text-gray-700 hover:text-blue-600",
                  key: "news",
                },
                "Hírek"
              ),
              React.createElement(UserButton, { key: "user-button" }),
            ]
          ),
          React.createElement(
            "button",
            {
              className: "md:hidden text-gray-700",
              onClick: () => setIsMenuOpen(!isMenuOpen),
              key: "mobile-toggle",
            },
            isMenuOpen
              ? React.createElement(X, { key: "close-icon" })
              : React.createElement(Menu, { key: "menu-icon" })
          ),
        ]
      ),
      isMenuOpen &&
        React.createElement(
          "div",
          { className: "md:hidden bg-white", key: "mobile-menu" },
          [
            React.createElement(
              "a",
              {
                href: "/",
                className: "block px-4 py-2 text-gray-700 hover:text-blue-600",
                key: "mobile-home",
              },
              "Kezdőlap"
            ),
            React.createElement(
              "a",
              {
                href: "/about",
                className: "block px-4 py-2 text-gray-700 hover:text-blue-600",
                key: "mobile-about",
              },
              "Rólam"
            ),
            React.createElement(
              "a",
              {
                href: "/program",
                className: "block px-4 py-2 text-gray-700 hover:text-blue-600",
                key: "mobile-program",
              },
              "Program"
            ),
            React.createElement(
              "a",
              {
                href: "/news",
                className: "block px-4 py-2 text-gray-700 hover:text-blue-600",
                key: "mobile-news",
              },
              "Hírek"
            ),
            React.createElement(
              "div",
              { className: "px-4 py-2", key: "mobile-user-button" },
              React.createElement(UserButton)
            ),
          ]
        ),
    ])
  );
};

export default Navigation;
