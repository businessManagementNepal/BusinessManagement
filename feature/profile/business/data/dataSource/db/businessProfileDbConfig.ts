import { BusinessProfileModel } from "./businessProfile.model";
import { businessProfilesTable } from "./businessProfile.schema";

export const businessProfileDbConfig = {
  models: [BusinessProfileModel],
  tables: [businessProfilesTable],
};
