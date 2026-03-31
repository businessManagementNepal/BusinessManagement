import { SaveAuthUserUseCase } from "@/feature/session/useCase/saveAuthUser.useCase";
import {
  EditablePersonalProfile,
  ProfileScreenData,
} from "@/feature/profile/screen/types/profileScreen.types";

export type UseProfilePersonalEditorViewModelParams = {
  activeUserRemoteId: string | null;
  data: ProfileScreenData;
  saveAuthUserUseCase: SaveAuthUserUseCase;
  onUpdateData: (
    updater: (previousData: ProfileScreenData) => ProfileScreenData,
  ) => void;
  setLoadError: (nextError: string | undefined) => void;
  setSuccessMessage: (nextMessage: string | undefined) => void;
};

export interface ProfilePersonalEditorViewModel {
  personalProfileForm: EditablePersonalProfile;
  isPersonalEditing: boolean;
  isSavingPersonalProfile: boolean;
  onStartPersonalEdit: () => void;
  onCancelPersonalEdit: () => void;
  onUpdatePersonalProfileField: (
    field: keyof EditablePersonalProfile,
    value: string,
  ) => void;
  onSavePersonalProfile: () => Promise<void>;
}
