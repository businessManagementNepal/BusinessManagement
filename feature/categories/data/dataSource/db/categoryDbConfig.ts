import { CategoryModel } from "./category.model";
import { categoriesTable } from "./category.schema";

export const categoryDbConfig = {
  models: [CategoryModel],
  tables: [categoriesTable],
};
