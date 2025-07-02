"use client";

import { useEffect } from "react";
import { logServerError } from "@/lib/error-logger";
import { AlertTriangle, RotateCcw, Home, Mail } from "lucide-react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error with admin context
    logServerError(error, {
      digest: error.digest,
      page: "admin",
      area: "admin_panel",
      userAgent: typeof window !== "undefined" ? navigator.userAgent : undefined,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      timestamp: new Date(),
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-8">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Admin hiba történt
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Az admin felületen hiba történt. Ez automatikusan jelentésre került.
        </p>

        {/* Error ID */}
        {error.digest && (
          <div className="mb-8">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              Hiba ID: {error.digest}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mb-8">
          <button
            onClick={reset}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Próbálja újra
          </button>

          <Link
            href="/admin"
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Home className="w-4 h-4 mr-2" />
            Admin főoldal
          </Link>

          <Link
            href="/"
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Főoldalra
          </Link>
        </div>

        {/* Development Error Details */}
        {process.env.NODE_ENV === "development" && (
          <div className="text-left bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              Fejlesztői információk:
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400 mb-2 font-mono">
              {error.message}
            </p>
            {error.stack && (
              <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto max-h-32 font-mono">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        {/* Help */}
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Ha a probléma továbbra is fennáll, kérjük jelezze a rendszergazdának.
          </p>
          <a
            href="mailto:admin@lovaszoltan.hu"
            className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <Mail className="w-4 h-4 mr-1" />
            admin@lovaszoltan.hu
          </a>
        </div>
      </div>
    </div>
  );
}