import { LiveOpsApiError } from "./errors";
import type { FrontendEnvelope } from "./types";

const configuredOrigin = import.meta.env.VITE_API_ORIGIN?.replace(/\/$/, "") ?? "";
const API_ROOT = `${configuredOrigin}/api/v1`;

export type RequestOptions = { signal?: AbortSignal; timeoutMs?: number };

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function isEnvelope(value: unknown): value is FrontendEnvelope {
  if (!isRecord(value) || typeof value.success !== "boolean" || !isRecord(value.meta)) return false;
  if (typeof value.meta.api_version !== "string" || typeof value.meta.request_id !== "string") return false;
  if (!("data" in value) || !("error" in value)) return false;
  return value.error === null || (isRecord(value.error) && typeof value.error.code === "string" && typeof value.error.message === "string" && typeof value.error.recoverable === "boolean");
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, options: RequestOptions = {}): Promise<{ data: T; requestId: string; apiVersion: string }> {
  const requestController = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => requestController.abort();
  options.signal?.addEventListener("abort", abortFromCaller, { once: true });
  if (options.signal?.aborted) requestController.abort();
  const timeout = window.setTimeout(() => { timedOut = true; requestController.abort(); }, options.timeoutMs ?? 30000);
  try {
    const response = await fetch(`${API_ROOT}${path}`, { ...init, signal: requestController.signal, headers: { Accept: "application/json", ...init.headers } });
    const boundary: unknown = await response.json();
    if (!isEnvelope(boundary)) throw new LiveOpsApiError({ code: "INVALID_RESPONSE", message: "The API returned a malformed response.", recoverable: true, details: {} }, response.status);
    const payload = boundary;
    if (!response.ok || !payload.success || payload.data === null) {
      throw new LiveOpsApiError(payload.error ?? { code: "INVALID_RESPONSE", message: "The API returned an invalid response.", recoverable: false, details: {} }, response.status, payload.meta?.request_id);
    }
    return { data: payload.data as T, requestId: payload.meta.request_id, apiVersion: payload.meta.api_version };
  } catch (error: unknown) {
    if (error instanceof LiveOpsApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      if (timedOut) throw new LiveOpsApiError({ code: "REQUEST_TIMEOUT", message: "The prediction service did not respond in time.", recoverable: true, details: {} }, 408);
      throw error;
    }
    throw new LiveOpsApiError({ code: "API_UNAVAILABLE", message: "The prediction service is unavailable.", recoverable: true, details: {} }, 0);
  } finally {
    window.clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }
}

export function multipart(file: File, fields: Record<string, string> = {}) {
  const body = new FormData();
  body.append("file", file);
  Object.entries(fields).forEach(([key, value]) => body.append(key, value));
  return body;
}
