import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class AppSettingsModel extends Model {
  static table = "app_settings";

  @field("selected_language") selectedLanguage!: string;
  @field("onboarding_completed") onboardingCompleted!: boolean;
  @field("active_user_remote_id") activeUserRemoteId!: string | null;
  @field("active_account_remote_id") activeAccountRemoteId!: string | null;
  @field("biometric_login_enabled") biometricLoginEnabled!: boolean;
  @field("two_factor_auth_enabled") twoFactorAuthEnabled!: boolean;

  @readonly
  @date("created_at")
  createdAt!: Date;

  @readonly
  @date("updated_at")
  updatedAt!: Date;
}