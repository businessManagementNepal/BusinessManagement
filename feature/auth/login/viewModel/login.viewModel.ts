import { Control } from "react-hook-form";
import { LoginInput, LoginState } from "../types/login.types";

export interface LoginViewModel {
  state: LoginState;
  control: Control<LoginInput>;
  isPasswordVisible: boolean;
  clearSubmitError: () => void;
  togglePasswordVisibility: () => void;
  submit: () => Promise<void>;
}

export type UseLoginViewModelOptions = {
  onSuccess?: () => void;
};
