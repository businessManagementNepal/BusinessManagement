import { LoginInput, LoginResult } from "../types/login.types";

export interface LoginWithEmailUseCase {
  login(payload: LoginInput): Promise<LoginResult>;
}