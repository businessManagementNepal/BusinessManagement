import { Account } from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";

export const sortAccountsByDefaultAndUpdatedAt = (
  accounts: Account[],
): Account[] => {
  return [...accounts].sort((leftAccount, rightAccount) => {
    if (leftAccount.isDefault !== rightAccount.isDefault) {
      return leftAccount.isDefault ? -1 : 1;
    }

    return rightAccount.updatedAt - leftAccount.updatedAt;
  });
};
