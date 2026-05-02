import { Result } from "@/shared/types/result.types";

export interface SyncFeatureFlagDatasource {
  getSyncEnabled(): Promise<Result<boolean>>;
}
