// src/hooks/useSessionTimeout.ts
"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { initializeSessionManager, destroySessionManager, SessionConfig } from "@/lib/session-manager";

interface UseSessionTimeoutOptions {
  enabled?: boolean;
  config?: Partial<SessionConfig>;
  onWarning?: () => void;
  onTimeout?: () => void;
  autoLogout?: boolean;
}

interface SessionTimeoutState {
  isWarning: boolean;
  timeUntilTimeout: number;
  timeUntilWarning: number;
  resetSession: () => void;
  extendSession: () => void;
}

export function useSessionTimeout(options: UseSessionTimeoutOptions = {}): SessionTimeoutState {
  const {
    enabled = true,
    config,
    onWarning,
    onTimeout,
    autoLogout = true,
  } = options;

  const { data: session, status } = useSession();
  const [isWarning, setIsWarning] = useState(false);
  const [timeUntilTimeout, setTimeUntilTimeout] = useState(0);
  const [timeUntilWarning, setTimeUntilWarning] = useState(0);
  const sessionManagerRef = useRef<any>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout>();

  const handleWarning = () => {
    setIsWarning(true);
    onWarning?.();
  };

  const handleTimeout = async () => {
    setIsWarning(false);
    onTimeout?.();
    
    if (autoLogout) {
      try {
        await signOut({ 
          callbackUrl: "/admin/login?message=session-expired",
          redirect: true 
        });
      } catch (error) {
        console.error("Error during automatic logout:", error);
        // Fallback: redirect manually
        window.location.href = "/admin/login?message=session-expired";
      }
    }
  };

  const resetSession = () => {
    if (sessionManagerRef.current) {
      sessionManagerRef.current.resetActivity();
      setIsWarning(false);
    }
  };

  const extendSession = () => {
    resetSession();
    // Optionally refresh the session token here
  };

  useEffect(() => {
    if (!enabled || status !== "authenticated" || !session) {
      return;
    }

    // Initialize session manager
    sessionManagerRef.current = initializeSessionManager(
      config,
      handleWarning,
      handleTimeout
    );

    // Update state periodically
    updateIntervalRef.current = setInterval(() => {
      if (sessionManagerRef.current) {
        setTimeUntilTimeout(sessionManagerRef.current.getTimeUntilTimeout());
        setTimeUntilWarning(sessionManagerRef.current.getTimeUntilWarning());
      }
    }, 1000);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      destroySessionManager();
    };
  }, [enabled, status, session]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      destroySessionManager();
    };
  }, []);

  return {
    isWarning,
    timeUntilTimeout,
    timeUntilWarning,
    resetSession,
    extendSession,
  };
}