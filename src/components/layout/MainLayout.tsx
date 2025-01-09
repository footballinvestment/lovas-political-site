"use client";

import NavBar from "@/components/sections/NavBar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="flex-1 container mx-auto px-4 pt-24 md:pt-28">
        {children}
      </main>
    </div>
  );
}
