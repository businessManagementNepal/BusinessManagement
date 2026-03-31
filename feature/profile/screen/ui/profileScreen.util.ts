import {
  AccountType,
  AccountTypeValue,
} from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import { ProfileAccountOption } from "@/feature/profile/screen/types/profileScreen.types";

export const resolveActiveAccountType = (
  activeAccountTypeLabel: string,
  accountOptions: readonly ProfileAccountOption[],
  activeAccountRemoteId: string | null,
): AccountTypeValue => {
  const activeAccount = accountOptions.find(
    (accountOption) => accountOption.remoteId === activeAccountRemoteId,
  );

  if (activeAccount) {
    return activeAccount.accountType;
  }

  if (activeAccountTypeLabel === "Business") {
    return AccountType.Business;
  }

  return AccountType.Personal;
};
