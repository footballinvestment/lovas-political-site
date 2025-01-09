import { Metadata } from "next";
import HeroSlider from "@/components/slider/HeroSlider";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Kezdőlap - Lovas Zoltán György",
  description:
    "Mindenki Magyarországa Néppárt - Lovas Zoltán György hivatalos weboldala",
};

export default async function Home() {
  // Aktív slide-ok lekérése
  const slides = await prisma.slide.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      order: "asc",
    },
  });

  return (
    <main className="min-h-screen">
      {/* Hero Slider */}
      <HeroSlider slides={slides} />

      {/* Program, Események, Kapcsolat kártyák */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Program kártya */}
          <div className="bg-blue-600 text-white rounded-2xl p-8 hover:shadow-xl transition duration-300">
            <h2 className="text-2xl font-bold mb-4">Programom</h2>
            <p className="mb-6">
              Ismerje meg részletes politikai programomat és terveimet az ország
              fejlesztésére.
            </p>
            <a
              href="/program"
              className="inline-flex items-center text-lg font-medium hover:underline"
            >
              Részletek
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>

          {/* Események kártya */}
          <div className="bg-purple-600 text-white rounded-2xl p-8 hover:shadow-xl transition duration-300">
            <h2 className="text-2xl font-bold mb-4">Események</h2>
            <p className="mb-6">
              Csatlakozzon hozzánk a következő rendezvényeken és mondja el
              véleményét személyesen.
            </p>
            <a
              href="/esemenyek"
              className="inline-flex items-center text-lg font-medium hover:underline"
            >
              Események
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>

          {/* Kapcsolat kártya */}
          <div className="bg-blue-600 text-white rounded-2xl p-8 hover:shadow-xl transition duration-300">
            <h2 className="text-2xl font-bold mb-4">Kapcsolat</h2>
            <p className="mb-6">
              Vegye fel velem a kapcsolatot kérdéseivel, javaslataival. Minden
              vélemény számít!
            </p>
            <a
              href="/kapcsolat"
              className="inline-flex items-center text-lg font-medium hover:underline"
            >
              Kapcsolat
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Legfrissebb Hírek szekció */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">
          Legfrissebb Hírek
        </h2>
        {/* Itt jöhetnek a hírek... */}
      </div>
    </main>
  );
}
