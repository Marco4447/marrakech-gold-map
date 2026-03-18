/**
 * Lightweight error reporting utility.
 * Captures errors and sends them to a configurable endpoint.
 * Currently logs to console in dev; can be wired to Sentry or similar in production.
 */

interface ErrorReport {
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  url: string;
  timestamp: string;
}

const ERROR_BUFFER: ErrorReport[] = [];
const MAX_BUFFER = 50;

export function reportError(error: unknown, context?: Record<string, unknown>) {
  const report: ErrorReport = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    url: typeof window !== "undefined" ? window.location.href : "",
    timestamp: new Date().toISOString(),
  };

  // Buffer for potential batch sending
  ERROR_BUFFER.push(report);
  if (ERROR_BUFFER.length > MAX_BUFFER) ERROR_BUFFER.shift();

  // Dev: log to console
  if (import.meta.env.DEV) {
    console.error("[ErrorReport]", report.message, context);
  }

  // Production: TODO wire to Sentry/LogRocket/custom endpoint
  // Example: fetch("/api/errors", { method: "POST", body: JSON.stringify(report) });
}

/**
 * Global error handlers. Call once at app startup.
 */
export function initErrorReporting() {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    reportError(event.error || event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportError(event.reason, { type: "unhandled_promise_rejection" });
  });
}

export function getErrorBuffer(): readonly ErrorReport[] {
  return ERROR_BUFFER;
}
