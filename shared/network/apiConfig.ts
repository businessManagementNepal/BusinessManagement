import { createApiConfigurationError } from "./networkError";

export const API_VERSION_PREFIX = "/api/v1";

const DEFAULT_DEVELOPMENT_API_BASE_URL = "http://127.0.0.1:8000";
const DEFAULT_DEVELOPMENT_API_PORT = "8000";
const LOCAL_API_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

export type ApiMode = "development" | "test" | "production";

export type ApiConfig = {
  baseUrl: string;
  buildUrl: (endpoint: string) => string;
};

type ResolveApiBaseUrlParams = {
  apiBaseUrl?: string | null;
  mode?: ApiMode | string | null;
  developmentFallbackBaseUrl?: string;
  developmentHostUri?: string | null;
};

const resolveMode = (mode: ResolveApiBaseUrlParams["mode"]): ApiMode => {
  if (mode === "production" || mode === "test") {
    return mode;
  }

  return "development";
};

const normalizeEndpoint = (endpoint: string): string => {
  const normalized = endpoint.trim();
  if (!normalized) {
    throw createApiConfigurationError("API endpoint is required.");
  }

  return normalized.startsWith("/") ? normalized : `/${normalized}`;
};

const formatOriginWithPort = (protocol: string, hostname: string): string => {
  const normalizedHostname = hostname.includes(":")
    ? `[${hostname}]`
    : hostname;

  return `${protocol}//${normalizedHostname}:${DEFAULT_DEVELOPMENT_API_PORT}`;
};

const resolveDevelopmentFallbackBaseUrlFromHostUri = (
  hostUri: string | null | undefined,
): string | null => {
  const normalizedHostUri =
    typeof hostUri === "string" ? hostUri.trim() : "";

  if (!normalizedHostUri) {
    return null;
  }

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(normalizedHostUri)
    ? normalizedHostUri
    : `http://${normalizedHostUri}`;

  try {
    const parsed = new URL(candidate);
    if (!parsed.hostname) {
      return null;
    }

    return normalizeApiBaseUrl(
      formatOriginWithPort(parsed.protocol, parsed.hostname),
      { mode: "development" },
    );
  } catch {
    return null;
  }
};

const tryResolveExpoDevelopmentHostUri = (): string | null => {
  try {
    const constantsModule = require("expo-constants");
    const constants = constantsModule?.default ?? constantsModule;

    const candidateValues = [
      constants?.expoConfig?.hostUri,
      constants?.expoGoConfig?.debuggerHost,
      constants?.manifest?.debuggerHost,
      constants?.platform?.hostUri,
    ];

    for (const candidate of candidateValues) {
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }
  } catch {
    return null;
  }

  return null;
};

const resolveDevelopmentFallbackBaseUrl = (
  params: Pick<
    ResolveApiBaseUrlParams,
    "developmentFallbackBaseUrl" | "developmentHostUri"
  >,
): string => {
  const derivedFromHostUri = resolveDevelopmentFallbackBaseUrlFromHostUri(
    params.developmentHostUri ?? tryResolveExpoDevelopmentHostUri(),
  );

  return (
    derivedFromHostUri ??
    params.developmentFallbackBaseUrl ??
    DEFAULT_DEVELOPMENT_API_BASE_URL
  );
};

export const normalizeApiBaseUrl = (
  apiBaseUrl: string,
  options: { mode?: ApiMode | string | null } = {},
): string => {
  const candidate = apiBaseUrl.trim().replace(/\/+$/, "");
  if (!candidate) {
    throw createApiConfigurationError("API base URL is required.");
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch (error) {
    throw createApiConfigurationError(
      "API base URL must be a valid absolute URL.",
      error,
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw createApiConfigurationError(
      "API base URL must use http or https.",
    );
  }

  if (parsed.pathname && parsed.pathname !== "/") {
    throw createApiConfigurationError(
      "API base URL must be origin only and must not include a path such as /api/v1.",
    );
  }

  if (
    resolveMode(options.mode) === "production" &&
    LOCAL_API_HOSTNAMES.has(parsed.hostname.toLowerCase())
  ) {
    throw createApiConfigurationError(
      "Production API base URL cannot point to a local development host.",
    );
  }

  return parsed.origin;
};

export const resolveApiBaseUrl = ({
  apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL,
  mode = process.env.NODE_ENV,
  developmentFallbackBaseUrl,
  developmentHostUri,
}: ResolveApiBaseUrlParams = {}): string => {
  const resolvedMode = resolveMode(mode);
  const candidate =
    typeof apiBaseUrl === "string" ? apiBaseUrl.trim() : "";

  if (!candidate) {
    if (resolvedMode === "production") {
      throw createApiConfigurationError(
        "EXPO_PUBLIC_API_BASE_URL is required in production.",
      );
    }

    return normalizeApiBaseUrl(
      resolveDevelopmentFallbackBaseUrl({
        developmentFallbackBaseUrl,
        developmentHostUri,
      }),
      {
        mode: resolvedMode,
      },
    );
  }

  return normalizeApiBaseUrl(candidate, {
    mode: resolvedMode,
  });
};

export const buildApiUrl = (
  apiBaseUrl: string,
  endpoint: string,
): string => {
  return `${normalizeApiBaseUrl(apiBaseUrl)}${normalizeEndpoint(endpoint)}`;
};

export const createApiConfig = (
  params: ResolveApiBaseUrlParams = {},
): ApiConfig => {
  const baseUrl = resolveApiBaseUrl(params);

  return {
    baseUrl,
    buildUrl(endpoint) {
      return buildApiUrl(baseUrl, endpoint);
    },
  };
};
