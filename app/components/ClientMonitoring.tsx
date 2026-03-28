"use client";

import { useEffect } from "react";
import { reportMonitoringEvent } from "@/lib/monitoring";

export function ClientMonitoring() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      void reportMonitoringEvent({
        context: {
          column: event.colno,
          error: event.error ? String(event.error) : undefined,
          filename: event.filename,
          line: event.lineno,
        },
        level: "error",
        message: event.message,
        source: "window.error",
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      void reportMonitoringEvent({
        context: {
          reason: String(event.reason),
        },
        level: "error",
        message: "Unhandled promise rejection",
        source: "window.unhandledrejection",
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
