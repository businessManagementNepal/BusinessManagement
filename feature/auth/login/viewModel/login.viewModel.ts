import { LoginState } from "../types/login.types";

export interface LoginViewModel {
  state: LoginState;
  phoneNumber: string;
  password: string;
  isPasswordVisible: boolean;
  changePhoneNumber: (value: string) => void;
  changePassword: (value: string) => void;
  togglePasswordVisibility: () => void;
  submit: () => Promise<void>;
}

export type UseLoginViewModelOptions = {
  onSuccess?: () => void;
};
