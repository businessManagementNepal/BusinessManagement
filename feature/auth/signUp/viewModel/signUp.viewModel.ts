import { Control } from "react-hook-form";
import { SignUpInput, SignUpState } from "../types/signUp.types";

export interface SignUpViewModel {
  state: SignUpState;
  control: Control<SignUpInput>;
  isPasswordVisible: boolean;
  clearSubmitError: () => void;
  togglePasswordVisibility: () => void;
  submit: () => Promise<void>;
}

export type UseSignUpViewModelOptions = {
  onSuccess?: () => void;
};
