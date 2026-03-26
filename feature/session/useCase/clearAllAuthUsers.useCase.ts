import { AuthOperationResult } from "../types/authSession.types";

export interface ClearAllAuthUsersUseCase {
  execute(): Promise<AuthOperationResult>;
}