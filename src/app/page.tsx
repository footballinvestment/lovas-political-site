// src/app/page.tsx
import { ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 pt-20">
        <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
        <div className="max-w-7xl mx-auto px-4 py-24 sm:py-32">
          <div className="text-center relative z-10">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Építsük együtt a
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
                jövő Magyarországát
              </span>
            </h1>
            <p className="mt-6 text-xl text-blue-100 max-w-2xl mx-auto">
              Modern megoldások, átlátható kormányzás, fenntartható fejlődés
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/program"
                className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-full text-blue-600 bg-white hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Programom megismerése
                <ChevronRight className="ml-2 h-5 w-5" />
              </a>
              <a
                href="/esemenyek"
                className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-full text-white border-2 border-white/30 hover:bg-white/10 transition-all duration-300"
              >
                Események
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 py-24">
        {/* ... többi tartalom ... */}
      </div>
    </div>
  );
}
