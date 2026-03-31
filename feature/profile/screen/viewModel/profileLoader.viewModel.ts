import { GetAccountsByOwnerUserRemoteIdUseCase } from "@/feature/setting/accounts/accountSelection/useCase/getAccountsByOwnerUserRemoteId.useCase";
import { GetAuthUserByRemoteIdUseCase } from "@/feature/session/useCase/getAuthUserByRemoteId.useCase";
import { GetBusinessProfileByAccountRemoteIdUseCase } from "@/feature/profile/business/useCase/getBusinessProfileByAccountRemoteId.useCase";
import { ProfileScreenData } from "@/feature/profile/screen/types/profileScreen.types";

export type UseProfileLoaderViewModelParams = {
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  getAccountsByOwnerUserRemoteIdUseCase: GetAccountsByOwnerUserRemoteIdUseCase;
  getAuthUserByRemoteIdUseCase: GetAuthUserByRemoteIdUseCase;
  getBusinessProfileByAccountRemoteIdUseCase: GetBusinessProfileByAccountRemoteIdUseCase;
  onLoaded: (nextData: ProfileScreenData) => void;
};

export interface ProfileLoaderViewModel {
  isLoading: boolean;
  loadError?: string;
  reload: () => Promise<void>;
  setLoadError: (nextError: string | undefined) => void;
}
