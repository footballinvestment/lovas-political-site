// src/components/admin/AdminSessionProvider.tsx
"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import SessionTimeoutWarning from "./SessionTimeoutWarning";
import { isAdminRoute } from "@/lib/rbac";

interface AdminSessionProviderProps {
  children: React.ReactNode;
}

export default function AdminSessionProvider({ children }: AdminSessionProviderProps) {
  const pathname = usePathname();
  const [showWarning, setShowWarning] = useState(false);
  
  const isAdminPath = isAdminRoute(pathname);

  const handleWarning = () => {
    setShowWarning(true);
  };

  const handleTimeout = () => {
    setShowWarning(false);
    // The hook will handle automatic logout
  };

  const {
    isWarning,
    timeUntilTimeout,
    resetSession,
    extendSession,
  } = useSessionTimeout({
    enabled: isAdminPath,
    config: {
      timeoutMinutes: 30,
      warningMinutes: 5,
      checkIntervalMs: 60000,
    },
    onWarning: handleWarning,
    onTimeout: handleTimeout,
    autoLogout: true,
  });

  const handleExtendSession = () => {
    extendSession();
    setShowWarning(false);
  };

  const handleManualLogout = async () => {
    setShowWarning(false);
    try {
      await signOut({ 
        callbackUrl: "/admin/login",
        redirect: true 
      });
    } catch (error) {
      console.error("Error during manual logout:", error);
      window.location.href = "/admin/login";
    }
  };

  return (
    <>
      {children}
      
      {/* Session timeout warning modal */}
      <SessionTimeoutWarning
        isVisible={showWarning}
        timeUntilTimeout={timeUntilTimeout}
        onExtendSession={handleExtendSession}
        onLogout={handleManualLogout}
      />
    </>
  );
}