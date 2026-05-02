import { SYNC_PULL_ENDPOINT, SYNC_PUSH_ENDPOINT } from "@/shared/sync/constants/sync.constants";
import {
  PullChangesRequestDto,
  PullChangesResponseDto,
  PushChangesRequestDto,
  PushChangesResponseDto,
} from "../../types/sync.dto.types";
import { SyncAuthHeaderAdapter } from "../adapter/syncAuthHeader.adapter";
import { SyncRemoteDatasource } from "./syncRemote.datasource";

type FetchLike = typeof fetch;

export type CreateRemoteSyncRemoteDatasourceParams = {
  apiBaseUrl: string;
  authHeaderAdapter: SyncAuthHeaderAdapter;
  fetchFn?: FetchLike;
};

const normalizeApiBaseUrl = (apiBaseUrl: string): string => {
  const normalized = apiBaseUrl.trim().replace(/\/+$/, "");
  if (!normalized) {
    throw new Error("Sync API base URL is required.");
  }
  return normalized;
};

const postJson = async <TRequest, TResponse>({
  apiBaseUrl,
  endpoint,
  body,
  authHeaderAdapter,
  fetchFn,
}: {
  apiBaseUrl: string;
  endpoint: string;
  body: TRequest;
  authHeaderAdapter: SyncAuthHeaderAdapter;
  fetchFn: FetchLike;
}): Promise<TResponse> => {
  const authHeaders = await authHeaderAdapter.getAuthHeaders();
  const response = await fetchFn(`${apiBaseUrl}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Sync request failed with status ${response.status}.`);
  }

  return (await response.json()) as TResponse;
};

export const createRemoteSyncRemoteDatasource = ({
  apiBaseUrl,
  authHeaderAdapter,
  fetchFn = fetch,
}: CreateRemoteSyncRemoteDatasourceParams): SyncRemoteDatasource => {
  const normalizedApiBaseUrl = normalizeApiBaseUrl(apiBaseUrl);

  return {
    pushChanges(input: PushChangesRequestDto): Promise<PushChangesResponseDto> {
      return postJson({
        apiBaseUrl: normalizedApiBaseUrl,
        endpoint: SYNC_PUSH_ENDPOINT,
        body: input,
        authHeaderAdapter,
        fetchFn,
      });
    },

    pullChanges(input: PullChangesRequestDto): Promise<PullChangesResponseDto> {
      return postJson({
        apiBaseUrl: normalizedApiBaseUrl,
        endpoint: SYNC_PULL_ENDPOINT,
        body: input,
        authHeaderAdapter,
        fetchFn,
      });
    },
  };
};
