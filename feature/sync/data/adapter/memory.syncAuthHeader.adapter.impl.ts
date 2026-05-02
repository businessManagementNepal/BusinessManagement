import { SyncAuthHeaderAdapter } from "./syncAuthHeader.adapter";

export const createMemorySyncAuthHeaderAdapter = (
  headers: Readonly<Record<string, string>> = {},
): SyncAuthHeaderAdapter => ({
  async getAuthHeaders() {
    return { ...headers };
  },
});
