// src/components/admin/SessionTimeoutWarning.tsx
"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, Clock, RotateCcw } from "lucide-react";

interface SessionTimeoutWarningProps {
  isVisible: boolean;
  timeUntilTimeout: number;
  onExtendSession: () => void;
  onLogout?: () => void;
}

export default function SessionTimeoutWarning({
  isVisible,
  timeUntilTimeout,
  onExtendSession,
  onLogout,
}: SessionTimeoutWarningProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    setTimeLeft(Math.floor(timeUntilTimeout / 1000));
  }, [timeUntilTimeout]);

  useEffect(() => {
    if (!isVisible || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, timeLeft]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Session Timeout Figyelmeztetés
            </h3>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              A session-öd inaktivitás miatt hamarosan lejár. Ha folytatni szeretnéd a munkát, 
              kattints a "Session meghosszabbítása" gombra.
            </p>
            
            <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Clock className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                {formatTime(timeLeft)}
              </span>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
              Automatikus kijelentkezés történik, ha nem reagálsz.
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onExtendSession}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Session meghosszabbítása
            </button>
            
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Kijelentkezés
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${Math.max(0, (timeLeft / 300) * 100)}%` // Assuming 5 minutes warning
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}