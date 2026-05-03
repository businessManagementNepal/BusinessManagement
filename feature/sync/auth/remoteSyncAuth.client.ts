import { createSecureSyncAuthHeaderAdapter } from "@/feature/sync/data/adapter/secure.syncAuthHeader.adapter.impl";
import { AuthTokenStore } from "@/shared/auth/authTokenStore";
import { API_VERSION_PREFIX, ApiConfig } from "@/shared/network/apiConfig";
import { createAuthenticatedHttpClient } from "@/shared/network/authenticatedHttpClient";
import {
  createHttpRequestError,
  createInvalidResponseError,
  isNetworkError,
} from "@/shared/network/networkError";

type FetchLike = typeof fetch;

export type RemoteAuthenticatedUser = {
  remoteId: string;
  username: string;
  email: string | null;
  displayName: string;
  phoneNumber: string;
  isActive: boolean;
};

export type RemoteAccountMembership = {
  membershipRemoteId: string;
  remoteId: string;
  displayName: string;
  countryCode: string;
  currencyCode: string;
  isActive: boolean;
  role: string;
  status: string;
};

export type RemoteAuthSession = {
  accessToken: string;
  refreshToken: string;
  user: RemoteAuthenticatedUser;
  accounts: RemoteAccountMembership[];
};

type LoginPayload = {
  username: string;
  password: string;
};

type RegisterPayload = {
  username: string;
  password: string;
  email?: string | null;
  displayName?: string | null;
  phoneNumber?: string | null;
};

type CreateBusinessAccountPayload = {
  displayName: string;
  countryCode?: string;
  currencyCode?: string;
};

type SelectAccountPayload = {
  remoteAccountRemoteId: string;
  deviceId?: string | null;
};

export interface RemoteSyncAuthClient {
  login(payload: LoginPayload): Promise<RemoteAuthSession>;
  register(payload: RegisterPayload): Promise<RemoteAuthSession>;
  createBusinessAccount(
    payload: CreateBusinessAccountPayload,
  ): Promise<RemoteAccountMembership>;
  selectAccount(
    payload: SelectAccountPayload,
  ): Promise<{
    account: RemoteAccountMembership;
    user: RemoteAuthenticatedUser;
  }>;
}

type CreateRemoteSyncAuthClientParams = {
  apiConfig: ApiConfig;
  tokenStore: AuthTokenStore;
  fetchFn?: FetchLike;
};

const PHONE_LOGIN_ENDPOINT = `${API_VERSION_PREFIX}/auth/login-phone`;
const LEGACY_LOGIN_ENDPOINT = `${API_VERSION_PREFIX}/auth/login`;
const PHONE_SIGN_UP_ENDPOINT = `${API_VERSION_PREFIX}/auth/signup-phone`;
const LEGACY_REGISTER_ENDPOINT = `${API_VERSION_PREFIX}/auth/register`;

const normalizeString = (value: unknown): string => {
  return typeof value === "string" ? value.trim() : "";
};

const normalizeOptionalString = (value: unknown): string | null => {
  const normalized = normalizeString(value);
  return normalized.length > 0 ? normalized : null;
};

const pickFirstString = (...values: unknown[]): string => {
  for (const value of values) {
    const normalized = normalizeString(value);
    if (normalized) {
      return normalized;
    }
  }

  return "";
};

const readBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = normalizeString(value).toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "active";
};

const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw createInvalidResponseError(undefined, error);
  }
};

const mapRemoteUser = (value: Record<string, unknown>): RemoteAuthenticatedUser => {
  const remoteId = pickFirstString(value.remoteId, value.remote_id, value.id);
  const phoneNumber = pickFirstString(
    value.phoneNumber,
    value.phone_number,
    value.phone,
  );
  const username = pickFirstString(
    value.username,
    value.loginId,
    value.login_id,
    phoneNumber,
  );
  const displayName = pickFirstString(
    value.displayName,
    value.display_name,
    value.fullName,
    value.full_name,
    value.name,
    username,
  );

  if (!remoteId || !username || !displayName || !phoneNumber) {
    throw createInvalidResponseError(
      "Backend authentication did not return a complete user payload.",
    );
  }

  return {
    remoteId,
    username,
    email: normalizeOptionalString(value.email),
    displayName,
    phoneNumber,
    isActive: readBoolean(value.isActive ?? value.is_active),
  };
};

const mapRemoteAccountMembership = (
  value: Record<string, unknown>,
): RemoteAccountMembership => {
  const membershipRemoteId = pickFirstString(
    value.membershipRemoteId,
    value.membership_remote_id,
    value.membershipId,
    value.membership_id,
    value.id,
  );
  const remoteId = pickFirstString(
    value.remoteId,
    value.remote_id,
    value.accountRemoteId,
    value.account_remote_id,
    value.accountId,
    value.account_id,
  );
  const displayName = pickFirstString(
    value.displayName,
    value.display_name,
    value.name,
  );

  if (!membershipRemoteId || !remoteId || !displayName) {
    throw createInvalidResponseError(
      "Backend authentication did not return a complete account payload.",
    );
  }

  return {
    membershipRemoteId,
    remoteId,
    displayName,
    countryCode: pickFirstString(value.countryCode, value.country_code),
    currencyCode: pickFirstString(value.currencyCode, value.currency_code),
    isActive: readBoolean(value.isActive ?? value.is_active),
    role: pickFirstString(value.role, value.roleName, value.role_name),
    status: pickFirstString(value.status, value.accountStatus, value.account_status),
  };
};

const mapRemoteAuthSession = (
  body: Record<string, unknown>,
): RemoteAuthSession => {
  const accessToken = normalizeString(body.access);
  const refreshToken = normalizeString(body.refresh);
  const userValue = body.user;
  const accountsValue = Array.isArray(body.accounts) ? body.accounts : [];

  if (!accessToken || !refreshToken || !userValue || typeof userValue !== "object") {
    throw createInvalidResponseError(
      "Backend authentication did not return tokens and user details.",
    );
  }

  return {
    accessToken,
    refreshToken,
    user: mapRemoteUser(userValue as Record<string, unknown>),
    accounts: accountsValue.map((account) =>
      mapRemoteAccountMembership(account as Record<string, unknown>),
    ),
  };
};

const shouldFallbackToAlternateAuthContract = (error: unknown): boolean => {
  return (
    isNetworkError(error) &&
    error.status !== null &&
    [400, 404, 405, 409, 422].includes(error.status)
  );
};

const postJsonWithoutAuth = async <TRequest, TResponse>({
  apiConfig,
  endpoint,
  body,
  fetchFn,
}: {
  apiConfig: ApiConfig;
  endpoint: string;
  body: TRequest;
  fetchFn: FetchLike;
}): Promise<TResponse> => {
  const response = await fetchFn(apiConfig.buildUrl(endpoint), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw createHttpRequestError(response.status);
  }

  return parseJsonResponse<TResponse>(response);
};

const postJsonWithoutAuthWithFallback = async <TResponse>({
  apiConfig,
  attempts,
  fetchFn,
}: {
  apiConfig: ApiConfig;
  attempts: ReadonlyArray<{
    endpoint: string;
    body: unknown;
  }>;
  fetchFn: FetchLike;
}): Promise<TResponse> => {
  let lastError: unknown;

  for (let index = 0; index < attempts.length; index += 1) {
    const attempt = attempts[index];

    try {
      return await postJsonWithoutAuth<unknown, TResponse>({
        apiConfig,
        endpoint: attempt.endpoint,
        body: attempt.body,
        fetchFn,
      });
    } catch (error) {
      lastError = error;

      if (
        index === attempts.length - 1 ||
        !shouldFallbackToAlternateAuthContract(error)
      ) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Backend authentication request failed.");
};

const buildPhoneLoginPayload = (payload: LoginPayload) => ({
  phone: normalizeString(payload.username),
  password: payload.password,
});

const buildLegacyLoginPayload = (payload: LoginPayload) => ({
  username: payload.username,
  password: payload.password,
});

const buildPhoneSignUpPayload = (payload: RegisterPayload) => {
  const fullName =
    normalizeOptionalString(payload.displayName) ??
    normalizeOptionalString(payload.username);
  const phone =
    normalizeOptionalString(payload.phoneNumber) ??
    normalizeOptionalString(payload.username);

  return {
    ...(fullName ? { fullName } : {}),
    ...(phone ? { phone } : {}),
    ...(normalizeOptionalString(payload.email) ? { email: payload.email } : {}),
    password: payload.password,
  };
};

const buildLegacyRegisterPayload = (payload: RegisterPayload) => ({
  username: payload.username,
  password: payload.password,
  ...(normalizeOptionalString(payload.email) ? { email: payload.email } : {}),
  ...(normalizeOptionalString(payload.displayName)
    ? { displayName: payload.displayName }
    : {}),
  ...(normalizeOptionalString(payload.phoneNumber)
    ? { phoneNumber: payload.phoneNumber }
    : {}),
});

export const createRemoteSyncAuthClient = ({
  apiConfig,
  tokenStore,
  fetchFn = fetch,
}: CreateRemoteSyncAuthClientParams): RemoteSyncAuthClient => {
  const authHeaderAdapter = createSecureSyncAuthHeaderAdapter({
    tokenStore,
  });
  const authenticatedHttpClient = createAuthenticatedHttpClient({
    apiConfig,
    getAuthHeaders: () => authHeaderAdapter.getAuthHeaders(),
    tokenStore,
    fetchFn,
  });

  return {
    async login(payload) {
      const body = await postJsonWithoutAuthWithFallback<Record<string, unknown>>({
        apiConfig,
        attempts: [
          {
            endpoint: PHONE_LOGIN_ENDPOINT,
            body: buildPhoneLoginPayload(payload),
          },
          {
            endpoint: LEGACY_LOGIN_ENDPOINT,
            body: buildLegacyLoginPayload(payload),
          },
        ],
        fetchFn,
      });

      return mapRemoteAuthSession(body);
    },

    async register(payload) {
      const body = await postJsonWithoutAuthWithFallback<Record<string, unknown>>({
        apiConfig,
        attempts: [
          {
            endpoint: PHONE_SIGN_UP_ENDPOINT,
            body: buildPhoneSignUpPayload(payload),
          },
          {
            endpoint: LEGACY_REGISTER_ENDPOINT,
            body: buildLegacyRegisterPayload(payload),
          },
        ],
        fetchFn,
      });

      return mapRemoteAuthSession(body);
    },

    async createBusinessAccount(payload) {
      const body = await authenticatedHttpClient.postJson<
        CreateBusinessAccountPayload,
        Record<string, unknown>
      >(`${API_VERSION_PREFIX}/accounts`, payload);

      return mapRemoteAccountMembership(body);
    },

    async selectAccount(payload) {
      const body = await authenticatedHttpClient.postJson<
        { deviceId?: string },
        {
          account: Record<string, unknown>;
          user: Record<string, unknown>;
        }
      >(`${API_VERSION_PREFIX}/accounts/${payload.remoteAccountRemoteId}/select`, {
        deviceId: normalizeOptionalString(payload.deviceId) ?? undefined,
      });

      return {
        account: mapRemoteAccountMembership(body.account),
        user: mapRemoteUser(body.user),
      };
    },
  };
};
