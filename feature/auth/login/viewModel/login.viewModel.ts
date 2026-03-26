import { LoginState } from "../types/login.types";

export interface LoginViewModel {
  state: LoginState;
  email: string;
  password: string;
  isPasswordVisible: boolean;
  changeEmail: (value: string) => void;
  changePassword: (value: string) => void;
  togglePasswordVisibility: () => void;
  submit: () => Promise<void>;
}

export type UseLoginViewModelOptions = {
  onSuccess?: () => void;
};