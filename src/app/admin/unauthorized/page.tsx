// src/app/admin/unauthorized/page.tsx
import Link from "next/link";
import { ShieldX, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <ShieldX className="mx-auto h-24 w-24 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Hozzáférés megtagadva
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Sajnáljuk, de nincs megfelelő jogosultságod az oldal megtekintéséhez.
          Kérlek, lépj kapcsolatba a rendszergazdával.
        </p>
        
        <div className="space-y-4">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Vissza az admin főoldalra
          </Link>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Főoldalra
          </Link>
        </div>
        
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Segítségre van szükséged?</strong><br />
            Írj nekünk: admin@lovaszoltan.hu
          </p>
        </div>
      </div>
    </div>
  );
}