import React from "react";
import ContactForm from "@/components/ContactForm";
import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata(
  "Kapcsolat",
  "Vegye fel velem a kapcsolatot kérdéseivel, javaslataival vagy támogatási szándékával. Minden vélemény számít!",
  "/kapcsolat",
  {
    keywords: "kapcsolat, kapcsolatfelvétel, Lovas Zoltán György, email, telefon, fogadóóra",
    image: "/images/og-contact.jpg",
  }
);

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#1C1C1C] pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1] bg-clip-text text-transparent mb-4">
            Kapcsolatfelvétel
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Örömmel veszem megkeresését. Kérem, töltse ki az alábbi űrlapot, és
            hamarosan felveszem Önnel a kapcsolatot.
          </p>
        </div>

        <div className="relative">
          {/* Háttér dekoráció */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#6DAEF0]/10 to-[#8DEBD1]/10 rounded-2xl -m-4" />

          {/* Contact form komponens */}
          <div className="relative">
            <ContactForm />
          </div>
        </div>

        {/* Kiegészítő információk */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur">
            <h3 className="text-xl font-semibold text-[#8DEBD1] mb-2">Email</h3>
            <p className="text-gray-300">kapcsolat@mindenkimagyarorszaga.hu</p>
          </div>
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur">
            <h3 className="text-xl font-semibold text-[#8DEBD1] mb-2">
              Telefon
            </h3>
            <p className="text-gray-300">+36 20 123 4567</p>
          </div>
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur">
            <h3 className="text-xl font-semibold text-[#8DEBD1] mb-2">
              Fogadóóra
            </h3>
            <p className="text-gray-300">Minden hétfőn 14:00 - 16:00</p>
          </div>
        </div>
      </div>
    </main>
  );
}
