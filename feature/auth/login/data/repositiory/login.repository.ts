import { LoginInput, LoginResult } from "../../types/login.types";

export interface LoginRepository {
  loginWithEmail(payload: LoginInput): Promise<LoginResult>;
}