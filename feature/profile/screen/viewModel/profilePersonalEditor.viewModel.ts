import { SaveAuthUserUseCase } from "@/feature/session/useCase/saveAuthUser.useCase";
import {
  EditablePersonalProfile,
  ProfileScreenData,
} from "@/feature/profile/screen/types/profileScreen.types";
import { PersonalProfileFieldErrors } from "@/feature/profile/screen/validation/validatePersonalProfileFields";

export type UseProfilePersonalEditorViewModelParams = {
  activeUserRemoteId: string | null;
  data: ProfileScreenData;
  saveAuthUserUseCase: SaveAuthUserUseCase;
  onUpdateData: (
    updater: (previousData: ProfileScreenData) => ProfileScreenData,
  ) => void;
  setLoadError: (nextError: string | null) => void;
  setSuccessMessage: (nextMessage: string | null) => void;
};

export interface ProfilePersonalEditorViewModel {
  personalProfileForm: EditablePersonalProfile;
  personalProfileFieldErrors: PersonalProfileFieldErrors;
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
