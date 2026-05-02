export interface SyncAuthHeaderAdapter {
  getAuthHeaders(): Promise<Record<string, string>>;
}
