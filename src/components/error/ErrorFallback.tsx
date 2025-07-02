// src/components/error/ErrorFallback.tsx
"use client";

import React, { useState } from "react";
import { 
  AlertTriangle, 
  RefreshCw, 
  RotateCcw, 
  Home, 
  Mail, 
  ChevronDown, 
  ChevronUp,
  Copy,
  Check
} from "lucide-react";
import Link from "next/link";

interface ErrorFallbackProps {
  error: Error | null;
  errorId: string | null;
  onRetry?: () => void;
  onReload?: () => void;
  retryCount?: number;
  showDetails?: boolean;
}

export default function ErrorFallback({
  error,
  errorId,
  onRetry,
  onReload,
  retryCount = 0,
  showDetails = false,
}: ErrorFallbackProps) {
  const [showErrorDetails, setShowErrorDetails] = useState(showDetails);
  const [copied, setCopied] = useState(false);

  const handleCopyError = async () => {
    if (!error || !errorId) return;

    const errorDetails = {
      id: errorId,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : "unknown",
      userAgent: typeof window !== "undefined" ? navigator.userAgent : "unknown",
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy error details:", err);
    }
  };

  const shouldShowRetry = onRetry && retryCount < 3;
  const errorMessage = error?.message || "Ismeretlen hiba történt";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full">
        {/* Error Icon */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Error Message */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Hiba történt
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Sajnáljuk, de valami hiba történt az alkalmazás működése közben.
          </p>
          
          {errorId && (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              Hiba azonosító: {errorId}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-8">
          {shouldShowRetry && (
            <button
              onClick={onRetry}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Próbálkozás újra ({3 - retryCount} maradt)
            </button>
          )}

          {onReload && (
            <button
              onClick={onReload}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Oldal újratöltése
            </button>
          )}

          <Link
            href="/"
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Home className="w-4 h-4 mr-2" />
            Főoldalra
          </Link>
        </div>

        {/* Error Details Toggle */}
        {error && process.env.NODE_ENV === "development" && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowErrorDetails(!showErrorDetails)}
              className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
            >
              <span>Hiba részletei (fejlesztői)</span>
              {showErrorDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showErrorDetails && (
              <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Hibaüzenet:
                    </label>
                    <p className="text-sm text-red-600 dark:text-red-400 font-mono bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      {errorMessage}
                    </p>
                  </div>

                  {error.stack && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Stack Trace:
                      </label>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto max-h-40 font-mono">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  <button
                    onClick={handleCopyError}
                    className="flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Másolva!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        Hiba részletek másolása
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Ha a probléma továbbra is fennáll, kérjük lépjen kapcsolatba velünk.
          </p>
          
          <div className="flex justify-center space-x-4">
            <Link
              href="/kapcsolat"
              className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <Mail className="w-4 h-4 mr-1" />
              Kapcsolatfelvétel
            </Link>
            
            <a
              href="mailto:admin@lovaszoltan.hu"
              className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Email küldése
            </a>
          </div>
        </div>

        {/* Retry Counter */}
        {retryCount > 0 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Próbálkozások száma: {retryCount}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}