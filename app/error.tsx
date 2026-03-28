"use client";

import { useEffect } from "react";
import { reportMonitoringEvent, serializeError } from "@/lib/monitoring";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void reportMonitoringEvent({
      context: {
        digest: error.digest,
        error: serializeError(error),
      },
      level: "error",
      message: error.message,
      source: "app.error-boundary",
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#06070A_0%,#0F1118_100%)] px-6 text-neutral-100">
      <div className="max-w-lg rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/30">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-200">
          Application Error
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Something went wrong while rendering the analyzer.
        </h1>
        <p className="mt-4 text-sm leading-6 text-neutral-300">
          The issue has been reported. You can try rendering the page again without
          losing your current session.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
