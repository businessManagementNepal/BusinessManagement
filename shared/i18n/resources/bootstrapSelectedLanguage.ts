import appDatabase from "@/app/database/database";
import { getSelectedLanguage } from "@/feature/session/data/appSession.store";
import { changeLanguage, isSupportedLanguageCode } from "./i18n";
import { FALLBACK_LANGUAGE } from "./types";

export const bootstrapSelectedLanguage = async (): Promise<void> => {
  try {
    const selectedLanguage = await getSelectedLanguage(appDatabase);

    if (isSupportedLanguageCode(selectedLanguage)) {
      changeLanguage(selectedLanguage);
      return;
    }
  } catch (error) {
    console.error("Failed to bootstrap selected language.", error);
  }

  changeLanguage(FALLBACK_LANGUAGE);
};
