import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class AppRatingModel extends Model {
  static table = "app_ratings";

  @field("remote_id") remoteId!: string;
  @field("user_remote_id") userRemoteId!: string;
  @field("star_count") starCount!: number;
  @field("review") review!: string | null;
  @field("submitted_at") submittedAt!: number;

  @readonly
  @date("created_at")
  createdAt!: Date;

  @readonly
  @date("updated_at")
  updatedAt!: Date;
}
