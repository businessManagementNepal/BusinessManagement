import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "elekha.auth.access_token";
const REFRESH_TOKEN_KEY = "elekha.auth.refresh_token";

type SecureStorageAdapter = Pick<
  typeof SecureStore,
  "getItemAsync" | "setItemAsync" | "deleteItemAsync"
>;

export type AuthTokenPair = {
  accessToken: string;
  refreshToken: string;
};

export interface AuthTokenStore {
  saveTokens(tokens: AuthTokenPair): Promise<void>;
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  getTokens(): Promise<AuthTokenPair | null>;
  clearTokens(): Promise<void>;
}

type CreateAuthTokenStoreParams = {
  secureStore?: SecureStorageAdapter;
  accessTokenKey?: string;
  refreshTokenKey?: string;
};

const normalizeToken = (value: string | null | undefined): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const requireToken = (value: string | null, label: string): string => {
  if (!value) {
    throw new Error(`${label} token is required.`);
  }

  return value;
};

export const createAuthTokenStore = ({
  secureStore = SecureStore,
  accessTokenKey = ACCESS_TOKEN_KEY,
  refreshTokenKey = REFRESH_TOKEN_KEY,
}: CreateAuthTokenStoreParams = {}): AuthTokenStore => ({
  async saveTokens(tokens) {
    const accessToken = requireToken(
      normalizeToken(tokens.accessToken),
      "Access",
    );
    const refreshToken = requireToken(
      normalizeToken(tokens.refreshToken),
      "Refresh",
    );

    await Promise.all([
      secureStore.setItemAsync(accessTokenKey, accessToken),
      secureStore.setItemAsync(refreshTokenKey, refreshToken),
    ]);
  },

  async getAccessToken() {
    return normalizeToken(await secureStore.getItemAsync(accessTokenKey));
  },

  async getRefreshToken() {
    return normalizeToken(await secureStore.getItemAsync(refreshTokenKey));
  },

  async getTokens() {
    const [accessToken, refreshToken] = await Promise.all([
      secureStore.getItemAsync(accessTokenKey),
      secureStore.getItemAsync(refreshTokenKey),
    ]);
    const normalizedAccessToken = normalizeToken(accessToken);
    const normalizedRefreshToken = normalizeToken(refreshToken);

    if (!normalizedAccessToken || !normalizedRefreshToken) {
      return null;
    }

    return {
      accessToken: normalizedAccessToken,
      refreshToken: normalizedRefreshToken,
    };
  },

  async clearTokens() {
    await Promise.all([
      secureStore.deleteItemAsync(accessTokenKey),
      secureStore.deleteItemAsync(refreshTokenKey),
    ]);
  },
});
