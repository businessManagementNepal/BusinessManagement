import {
  SubmitAppRatingPayload,
  SubmitAppRatingResult,
} from "@/feature/appSettings/settings/types/settings.types";

export interface SubmitAppRatingUseCase {
  execute(payload: SubmitAppRatingPayload): Promise<SubmitAppRatingResult>;
}
