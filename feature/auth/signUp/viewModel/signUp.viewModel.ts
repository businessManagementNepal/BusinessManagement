import { SignUpState } from "../types/signUp.types";

export interface SignUpViewModel {
  state: SignUpState;
  fullName: string;
  phoneNumber: string;
  password: string;
  isPasswordVisible: boolean;
  changeFullName: (value: string) => void;
  changePhoneNumber: (value: string) => void;
  changePassword: (value: string) => void;
  togglePasswordVisibility: () => void;
  submit: () => Promise<void>;
}

export type UseSignUpViewModelOptions = {
  onSuccess?: () => void;
};
