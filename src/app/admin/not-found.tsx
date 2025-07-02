import Link from "next/link";
import { Shield, Home, ArrowLeft, Settings } from "lucide-react";

export default function AdminNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Admin 404 Illustration */}
        <div className="mb-8">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <Shield className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600">
            404
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Admin oldal nem található
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          A keresett admin oldal nem található. Ellenőrizze a link helyességét, 
          vagy használja a navigációt.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3 mb-8">
          <Link
            href="/admin"
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Settings className="w-5 h-5 mr-2" />
            Admin főoldal
          </Link>

          <Link
            href="/"
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Home className="w-5 h-5 mr-2" />
            Főoldalra
          </Link>

          <button
            onClick={() => typeof window !== "undefined" && window.history.back()}
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Vissza
          </button>
        </div>

        {/* Admin Quick Navigation */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Admin funkciók
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Link
              href="/admin/posts"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
            >
              Bejegyzések
            </Link>
            <Link
              href="/admin/events"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
            >
              Események
            </Link>
            <Link
              href="/admin/messages"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
            >
              Üzenetek
            </Link>
            <Link
              href="/admin/themes"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
            >
              Témák
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            🔒 <strong>Biztonsági emlékeztető:</strong> Admin területen tartózkodik. 
            Győződjön meg róla, hogy jogosultsága van az oldal eléréséhez.
          </p>
        </div>
      </div>
    </div>
  );
}