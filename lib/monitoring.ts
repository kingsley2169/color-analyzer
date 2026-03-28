export type MonitoringLevel = "error" | "info";

export type MonitoringPayload = {
  context?: Record<string, unknown>;
  level: MonitoringLevel;
  message: string;
  source: string;
};

export async function reportMonitoringEvent(payload: MonitoringPayload): Promise<void> {
  try {
    await fetch("/api/monitoring", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    if (payload.level === "error") {
      console.error("[monitoring:fallback]", payload);
    } else {
      console.info("[monitoring:fallback]", payload);
    }
  }
}

export function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  return {
    value: String(error),
  };
}
