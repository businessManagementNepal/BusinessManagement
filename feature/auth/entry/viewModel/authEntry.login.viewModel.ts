import { Control } from "react-hook-form";
import { LoginInput } from "@/feature/auth/login/types/login.types";

export interface AuthEntryLoginViewModel {
  control: Control<LoginInput>;
  clearSubmitError: () => void;
  isPasswordVisible: boolean;
  togglePasswordVisibility: () => void;
  isSubmitting: boolean;
  submitError?: string;
  submit: () => Promise<void>;
}
