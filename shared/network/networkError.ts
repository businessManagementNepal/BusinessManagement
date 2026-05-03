export const NetworkErrorCode = {
  ApiConfiguration: "API_CONFIGURATION_ERROR",
  AuthenticationRequired: "AUTHENTICATION_REQUIRED",
  AuthenticationRefreshFailed: "AUTHENTICATION_REFRESH_FAILED",
  HttpRequestFailed: "HTTP_REQUEST_FAILED",
  InvalidResponse: "INVALID_RESPONSE",
} as const;

export type NetworkErrorCodeValue =
  (typeof NetworkErrorCode)[keyof typeof NetworkErrorCode];

type NetworkErrorOptions = {
  code: NetworkErrorCodeValue;
  status?: number;
  isRetryable?: boolean;
  cause?: unknown;
};

export class NetworkError extends Error {
  readonly code: NetworkErrorCodeValue;
  readonly status: number | null;
  readonly isRetryable: boolean;

  constructor(message: string, options: NetworkErrorOptions) {
    super(message);
    this.name = "NetworkError";
    this.code = options.code;
    this.status =
      typeof options.status === "number" ? options.status : null;
    this.isRetryable = options.isRetryable ?? false;

    if ("cause" in Error.prototype) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

export const isNetworkError = (value: unknown): value is NetworkError => {
  return value instanceof NetworkError;
};

export const createApiConfigurationError = (
  message: string,
  cause?: unknown,
): NetworkError => {
  return new NetworkError(message, {
    code: NetworkErrorCode.ApiConfiguration,
    cause,
  });
};

export const createAuthenticationRequiredError = (
  message = "Sync authentication token is required.",
  cause?: unknown,
): NetworkError => {
  return new NetworkError(message, {
    code: NetworkErrorCode.AuthenticationRequired,
    cause,
  });
};

export const createAuthenticationRefreshFailedError = (
  message = "Authentication refresh failed. Sign in again.",
  cause?: unknown,
): NetworkError => {
  return new NetworkError(message, {
    code: NetworkErrorCode.AuthenticationRefreshFailed,
    cause,
  });
};

export const createHttpRequestError = (
  status: number,
  message = `Sync request failed with status ${status}.`,
  cause?: unknown,
): NetworkError => {
  return new NetworkError(message, {
    code: NetworkErrorCode.HttpRequestFailed,
    status,
    isRetryable: status >= 500,
    cause,
  });
};

export const createInvalidResponseError = (
  message = "The server returned an invalid response.",
  cause?: unknown,
): NetworkError => {
  return new NetworkError(message, {
    code: NetworkErrorCode.InvalidResponse,
    cause,
  });
};
