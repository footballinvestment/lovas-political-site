"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function ProgramError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to your error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#1C1C1C] pt-20">
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="bg-red-900/20 border border-red-900 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-400 mb-2">
                Hiba történt
              </h3>
              <p className="text-red-200">
                Sajnáljuk, de hiba történt a program betöltése közben. Kérjük,
                próbálja újra később.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1] text-gray-900 rounded-full hover:shadow-lg transition-all duration-300"
          >
            Próbálja újra
          </button>
        </div>
      </div>
    </div>
  );
}
