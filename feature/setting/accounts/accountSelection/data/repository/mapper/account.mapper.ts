import { Account } from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import { AccountModel } from "../../dataSource/db/account.model";

export const mapAccountModelToDomain = async (
  model: AccountModel,
): Promise<Account> => {
  return {
    remoteId: model.remoteId,
    ownerUserRemoteId: model.ownerUserRemoteId,
    accountType: model.accountType,
    businessType: model.businessType,
    displayName: model.displayName,
    currencyCode: model.currencyCode,
    cityOrLocation: model.cityOrLocation,
    countryCode: model.countryCode,
    isActive: model.isActive,
    isDefault: model.isDefault,
    createdAt: model.createdAt.getTime(),
    updatedAt: model.updatedAt.getTime(),
  };
};
