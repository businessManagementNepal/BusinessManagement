import { Category } from "@/feature/categories/types/category.types";
import { CategoryModel } from "@/feature/categories/data/dataSource/db/category.model";

export const mapCategoryModelToDomain = (model: CategoryModel): Category => ({
  remoteId: model.remoteId,
  ownerUserRemoteId: model.ownerUserRemoteId,
  accountRemoteId: model.accountRemoteId,
  accountType: model.accountType,
  scope: model.scope,
  kind: model.kind,
  name: model.name,
  description: model.description,
  isSystem: model.isSystem,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});
