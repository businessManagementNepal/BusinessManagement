import { SYNC_PULL_ENDPOINT, SYNC_PUSH_ENDPOINT } from "@/shared/sync/constants/sync.constants";
import { createApiConfig } from "@/shared/network/apiConfig";
import { AuthenticatedHttpClient } from "@/shared/network/authenticatedHttpClient";
import { createHttpRequestError } from "@/shared/network/networkError";
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
  httpClient?: AuthenticatedHttpClient;
  fetchFn?: FetchLike;
};

const createFallbackHttpClient = ({
  apiBaseUrl,
  authHeaderAdapter,
  fetchFn,
}: {
  apiBaseUrl: string;
  authHeaderAdapter: SyncAuthHeaderAdapter;
  fetchFn: FetchLike;
}): AuthenticatedHttpClient => {
  const apiConfig = createApiConfig({ apiBaseUrl });

  return {
    async postJson<TRequest, TResponse>(endpoint: string, body: TRequest) {
      const authHeaders = await authHeaderAdapter.getAuthHeaders();
      const response = await fetchFn(apiConfig.buildUrl(endpoint), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw createHttpRequestError(response.status);
      }

      return (await response.json()) as TResponse;
    },
  };
};

export const createRemoteSyncRemoteDatasource = ({
  apiBaseUrl,
  authHeaderAdapter,
  httpClient,
  fetchFn = fetch,
}: CreateRemoteSyncRemoteDatasourceParams): SyncRemoteDatasource => {
  const client =
    httpClient ??
    createFallbackHttpClient({
      apiBaseUrl,
      authHeaderAdapter,
      fetchFn,
    });

  return {
    pushChanges(input: PushChangesRequestDto): Promise<PushChangesResponseDto> {
      return client.postJson(SYNC_PUSH_ENDPOINT, input);
    },

    pullChanges(input: PullChangesRequestDto): Promise<PullChangesResponseDto> {
      return client.postJson(SYNC_PULL_ENDPOINT, input);
    },
  };
};
