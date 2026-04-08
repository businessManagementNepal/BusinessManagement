import { AppRatingModel } from "./appRating.model";
import { appRatingsTable } from "./appRating.schema";

export const appRatingDbConfig = {
  models: [AppRatingModel],
  tables: [appRatingsTable],
};
