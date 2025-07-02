"use client";

import { useEffect } from "react";
import { logServerError } from "@/lib/error-logger";
import ErrorFallback from "@/components/error/ErrorFallback";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error
    logServerError(error, {
      digest: error.digest,
      page: "global",
      userAgent: typeof window !== "undefined" ? navigator.userAgent : undefined,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      timestamp: new Date(),
    });
  }, [error]);

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <html lang="hu">
      <body>
        <ErrorFallback
          error={error}
          errorId={error.digest || `global-${Date.now()}`}
          onRetry={reset}
          onReload={handleReload}
          showDetails={process.env.NODE_ENV === "development"}
        />
      </body>
    </html>
  );
}