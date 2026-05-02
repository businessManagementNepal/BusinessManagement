import { SYNC_PULL_ENDPOINT, SYNC_PUSH_ENDPOINT } from "@/shared/sync/constants/sync.constants";
import {
  PullChangesRequestDto,
  PullChangesResponseDto,
  PushChangesRequestDto,
  PushChangesResponseDto,
} from "../../types/sync.dto.types";
import { SyncRemoteDatasource } from "./syncRemote.datasource";

type FetchLike = typeof fetch;

type CreateRemoteSyncRemoteDatasourceParams = {
  apiBaseUrl: string;
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
  fetchFn,
}: {
  apiBaseUrl: string;
  endpoint: string;
  body: TRequest;
  fetchFn: FetchLike;
}): Promise<TResponse> => {
  const response = await fetchFn(`${apiBaseUrl}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
  fetchFn = fetch,
}: CreateRemoteSyncRemoteDatasourceParams): SyncRemoteDatasource => {
  const normalizedApiBaseUrl = normalizeApiBaseUrl(apiBaseUrl);

  return {
    pushChanges(input: PushChangesRequestDto): Promise<PushChangesResponseDto> {
      return postJson({
        apiBaseUrl: normalizedApiBaseUrl,
        endpoint: SYNC_PUSH_ENDPOINT,
        body: input,
        fetchFn,
      });
    },

    pullChanges(input: PullChangesRequestDto): Promise<PullChangesResponseDto> {
      return postJson({
        apiBaseUrl: normalizedApiBaseUrl,
        endpoint: SYNC_PULL_ENDPOINT,
        body: input,
        fetchFn,
      });
    },
  };
};
