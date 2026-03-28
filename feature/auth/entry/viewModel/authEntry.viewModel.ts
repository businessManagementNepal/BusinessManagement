import { AuthEntryLanguageViewModel } from "./authEntry.language.viewModel";
import { AuthEntryLoginViewModel } from "./authEntry.login.viewModel";
import { AuthEntrySignUpViewModel } from "./authEntry.signUp.viewModel";

export interface AuthEntryViewModel {
  language: AuthEntryLanguageViewModel;
  login: AuthEntryLoginViewModel;
  signUp: AuthEntrySignUpViewModel;
  onForgotPasswordPress?: () => void;
}
