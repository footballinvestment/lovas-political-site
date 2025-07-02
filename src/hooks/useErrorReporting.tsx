// src/hooks/useErrorReporting.ts
"use client";

import React, { useCallback } from "react";
import { useSession } from "next-auth/react";
import { logError, logAPIError, logClientError, ErrorSeverity, ErrorContext } from "@/lib/error-logger";

export function useErrorReporting() {
  const { data: session } = useSession();

  const reportError = useCallback(async (
    error: Error | unknown,
    context: Partial<ErrorContext> = {},
    severity?: ErrorSeverity
  ) => {
    try {
      // Add session context if available
      const enhancedContext: Partial<ErrorContext> = {
        ...context,
        userId: session?.user?.id,
        userRole: session?.user?.role,
        sessionId: session ? "authenticated" : "anonymous",
      };

      await logError(error, enhancedContext, severity);
    } catch (loggingError) {
      console.error("Failed to report error:", loggingError);
    }
  }, [session]);

  const reportAPIError = useCallback(async (
    error: Error | unknown,
    endpoint: string,
    method: string = "GET",
    statusCode?: number
  ) => {
    const context: Partial<ErrorContext> = {
      userId: session?.user?.id,
      userRole: session?.user?.role,
      method,
      statusCode,
      endpoint,
      api: true,
    };

    try {
      await logAPIError(error, context);
    } catch (loggingError) {
      console.error("Failed to report API error:", loggingError);
    }
  }, [session]);

  const reportClientError = useCallback(async (
    error: Error | unknown,
    component?: string,
    action?: string
  ) => {
    const context: Partial<ErrorContext> = {
      userId: session?.user?.id,
      userRole: session?.user?.role,
      component,
      action,
      client: true,
    };

    try {
      await logClientError(error, context);
    } catch (loggingError) {
      console.error("Failed to report client error:", loggingError);
    }
  }, [session]);

  return {
    reportError,
    reportAPIError,
    reportClientError,
  };
}

// HOC for automatic error reporting in components
export function withErrorReporting<T extends object>(
  Component: React.ComponentType<T>,
  componentName?: string
) {
  const WrappedComponent = (props: T) => {
    const { reportClientError } = useErrorReporting();

    const handleError = useCallback((error: Error | unknown) => {
      reportClientError(error, componentName || Component.displayName || Component.name);
    }, [reportClientError]);

    // Add error handler to props if the component accepts it
    const enhancedProps = {
      ...props,
      onError: handleError,
    } as T & { onError?: (error: Error | unknown) => void };

    return <Component {...enhancedProps} />;
  };

  WrappedComponent.displayName = `withErrorReporting(${componentName || Component.displayName || Component.name})`;
  
  return WrappedComponent;
}