import { AuthTokenPair, AuthTokenStore } from "@/shared/auth/authTokenStore";
import { ApiConfig, API_VERSION_PREFIX } from "./apiConfig";
import {
  createAuthenticationRefreshFailedError,
  createHttpRequestError,
  createInvalidResponseError,
  isNetworkError,
} from "./networkError";

type FetchLike = typeof fetch;

export type RefreshAuthSession = (
  refreshToken: string,
) => Promise<{
  accessToken: string;
  refreshToken?: string | null;
}>;

export interface AuthenticatedHttpClient {
  postJson<TRequest, TResponse>(
    endpoint: string,
    body: TRequest,
  ): Promise<TResponse>;
}

type CreateAuthenticatedHttpClientParams = {
  apiConfig: ApiConfig;
  getAuthHeaders: () => Promise<Record<string, string>>;
  tokenStore: AuthTokenStore;
  fetchFn?: FetchLike;
  refreshAuthSession?: RefreshAuthSession;
  onAuthFailure?: () => Promise<void> | void;
};

const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;

const normalizeToken = (value: string | null | undefined): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw createInvalidResponseError(undefined, error);
  }
};

const createDefaultRefreshAuthSession = ({
  apiConfig,
  fetchFn,
}: {
  apiConfig: ApiConfig;
  fetchFn: FetchLike;
}): RefreshAuthSession => {
  return async (refreshToken) => {
    const response = await fetchFn(apiConfig.buildUrl(`${API_VERSION_PREFIX}/auth/refresh`), {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw createAuthenticationRefreshFailedError(
        "Authentication refresh failed. Sign in again.",
      );
    }

    const body = await parseJsonResponse<Record<string, unknown>>(response);
    const accessToken = normalizeToken(body.access as string | null | undefined);
    const nextRefreshToken = normalizeToken(
      body.refresh as string | null | undefined,
    );

    if (!accessToken) {
      throw createInvalidResponseError(
        "Authentication refresh did not return a valid access token.",
      );
    }

    return {
      accessToken,
      refreshToken: nextRefreshToken ?? refreshToken,
    };
  };
};

const persistRefreshedTokens = async (
  tokenStore: AuthTokenStore,
  tokens: { accessToken: string; refreshToken?: string | null },
  fallbackRefreshToken: string,
): Promise<AuthTokenPair> => {
  const accessToken = normalizeToken(tokens.accessToken);
  const refreshToken = normalizeToken(tokens.refreshToken) ?? fallbackRefreshToken;

  if (!accessToken || !refreshToken) {
    throw createAuthenticationRefreshFailedError();
  }

  await tokenStore.saveTokens({
    accessToken,
    refreshToken,
  });

  return {
    accessToken,
    refreshToken,
  };
};

const clearSessionSafely = async (
  tokenStore: AuthTokenStore,
  onAuthFailure: (() => Promise<void> | void) | undefined,
): Promise<void> => {
  await tokenStore.clearTokens();
  await onAuthFailure?.();
};

export const createAuthenticatedHttpClient = ({
  apiConfig,
  getAuthHeaders,
  tokenStore,
  fetchFn = fetch,
  refreshAuthSession,
  onAuthFailure,
}: CreateAuthenticatedHttpClientParams): AuthenticatedHttpClient => {
  const refreshSession =
    refreshAuthSession ??
    createDefaultRefreshAuthSession({
      apiConfig,
      fetchFn,
    });

  const postJson = async <TRequest, TResponse>(
    endpoint: string,
    body: TRequest,
    hasRetried = false,
  ): Promise<TResponse> => {
    const response = await fetchFn(apiConfig.buildUrl(endpoint), {
      method: "POST",
      headers: {
        ...JSON_HEADERS,
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify(body),
    });

    if (response.status === 401) {
      if (hasRetried) {
        await clearSessionSafely(tokenStore, onAuthFailure);
        throw createAuthenticationRefreshFailedError();
      }

      const refreshToken = await tokenStore.getRefreshToken();
      if (!refreshToken) {
        await clearSessionSafely(tokenStore, onAuthFailure);
        throw createAuthenticationRefreshFailedError();
      }

      try {
        const refreshedTokens = await refreshSession(refreshToken);
        await persistRefreshedTokens(tokenStore, refreshedTokens, refreshToken);
      } catch (error) {
        await clearSessionSafely(tokenStore, onAuthFailure);
        if (
          isNetworkError(error) &&
          error.code === "AUTHENTICATION_REFRESH_FAILED"
        ) {
          throw error;
        }

        throw createAuthenticationRefreshFailedError(undefined, error);
      }

      return postJson(endpoint, body, true);
    }

    if (!response.ok) {
      throw createHttpRequestError(response.status);
    }

    return parseJsonResponse<TResponse>(response);
  };

  return {
    postJson(endpoint, body) {
      return postJson(endpoint, body);
    },
  };
};
