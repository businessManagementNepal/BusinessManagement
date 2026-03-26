import { AuthUserModel } from "./authUser.model";
import { authUsersTable } from "./authUser.schema";

export const authUserDbConfig = {
  models: [AuthUserModel],
  tables: [authUsersTable],
};
