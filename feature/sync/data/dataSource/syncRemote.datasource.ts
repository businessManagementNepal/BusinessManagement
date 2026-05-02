import {
  PullChangesRequestDto,
  PullChangesResponseDto,
  PushChangesRequestDto,
  PushChangesResponseDto,
} from "../../types/sync.dto.types";

export interface SyncRemoteDatasource {
  pushChanges(input: PushChangesRequestDto): Promise<PushChangesResponseDto>;
  pullChanges(input: PullChangesRequestDto): Promise<PullChangesResponseDto>;
}
