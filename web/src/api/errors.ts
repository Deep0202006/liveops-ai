import type { components } from "./generated/openapi";

export class LiveOpsApiError extends Error {
  readonly code: string;
  readonly recoverable: boolean;
  readonly requestId?: string;
  readonly status: number;

  constructor(error: components["schemas"]["ApiError"], status: number, requestId?: string) {
    super(error.message);
    this.name = "LiveOpsApiError";
    this.code = error.code;
    this.recoverable = error.recoverable;
    this.requestId = requestId;
    this.status = status;
  }
}

export function isValidationError(error: unknown) {
  return error instanceof LiveOpsApiError && error.status >= 400 && error.status < 500;
}

export function errorPresentation(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return { title: "Request cancelled", message: "The previous request was safely stopped.", action: "Choose a file or retry when ready.", code: "REQUEST_ABORTED" };
  }
  if (error instanceof LiveOpsApiError) {
    const titles: Record<string, string> = {
      UPLOAD_TOO_LARGE: "File exceeds 4 MiB",
      UNSUPPORTED_MEDIA_TYPE: "Unsupported file type",
      INVALID_SCHEMA: "Sensor schema is not valid",
      DUPLICATE_MACHINE_CYCLE: "Duplicate machine cycle",
      INSUFFICIENT_HISTORY: "More history is required",
      MACHINE_NOT_FOUND: "Machine is unavailable",
      MODEL_NOT_TRAINED: "Real model is unavailable",
      ARTIFACT_UNAVAILABLE: "Model artifact is unavailable",
      PREDICTION_FAILED: "Prediction could not complete",
      REQUEST_TIMEOUT: "Request timed out",
      INVALID_RESPONSE: "API response could not be verified",
    };
    const retryable = ["REQUEST_TIMEOUT", "API_UNAVAILABLE", "INVALID_RESPONSE", "INTERNAL_ERROR", "PREDICTION_FAILED"].includes(error.code);
    return { title: titles[error.code] ?? "LiveOps request failed", message: error.message, action: retryable ? "Retry the request. If it continues, inspect system status." : error.recoverable ? "Correct the input and try again." : "Check system status or contact the operator.", code: error.code, requestId: error.requestId };
  }
  return { title: "API unavailable", message: "LiveOps AI could not reach the prediction service.", action: "Confirm the API is running, then retry.", code: "API_UNAVAILABLE" };
}
