import { SyncAuthHeaderAdapter } from "./syncAuthHeader.adapter";

type CreateSecureSyncAuthHeaderAdapterParams = {
  getAccessToken: () => Promise<string | null>;
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
  getAccessToken,
  requireAuth = true,
}: CreateSecureSyncAuthHeaderAdapterParams): SyncAuthHeaderAdapter => ({
  async getAuthHeaders() {
    const accessToken = normalizeAccessToken(await getAccessToken());
    if (!accessToken) {
      if (requireAuth) {
        throw new Error("Sync authentication token is required.");
      }

      return {} as Record<string, string>;
    }

    return {
      Authorization: `Bearer ${accessToken}`,
    } as Record<string, string>;
  },
});
