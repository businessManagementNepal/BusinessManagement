import { SyncAuthHeaderAdapter } from "./syncAuthHeader.adapter";
import { AuthTokenStore } from "@/shared/auth/authTokenStore";
import { createAuthenticationRequiredError } from "@/shared/network/networkError";

type CreateSecureSyncAuthHeaderAdapterParams = {
  tokenStore?: Pick<AuthTokenStore, "getAccessToken">;
  getAccessToken?: () => Promise<string | null>;
  requireAuth?: boolean;
};

const normalizeAccessToken = (value: string | null): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

export const createSecureSyncAuthHeaderAdapter = ({
  tokenStore,
  getAccessToken,
  requireAuth = true,
}: CreateSecureSyncAuthHeaderAdapterParams): SyncAuthHeaderAdapter => ({
  async getAuthHeaders() {
    const accessTokenReader = tokenStore?.getAccessToken ?? getAccessToken;
    if (!accessTokenReader) {
      throw new Error("A secure access token reader is required.");
    }

    const accessToken = normalizeAccessToken(await accessTokenReader());
    if (!accessToken) {
      if (requireAuth) {
        throw createAuthenticationRequiredError();
      }

      return {} as Record<string, string>;
    }

    return {
      Authorization: `Bearer ${accessToken}`,
    } as Record<string, string>;
  },
});
