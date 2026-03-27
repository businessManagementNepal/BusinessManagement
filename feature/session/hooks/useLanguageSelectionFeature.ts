import { Database } from "@nozbe/watermelondb";
import { useCallback, useMemo } from "react";
import { setSelectedLanguage } from "@/feature/session/data/appSession.store";
import {
  changeLanguage,
  SUPPORTED_LANGUAGE_OPTIONS,
  SupportedLanguageCode,
  useCurrentLanguageCode,
} from "@/shared/i18n/resources";
import { LanguageSelectionViewModel } from "../types/languageSelection.types";

type UseLanguageSelectionFeatureParams = {
  database: Database;
};

export function useLanguageSelectionFeature(
  params: UseLanguageSelectionFeatureParams,
): LanguageSelectionViewModel {
  const { database } = params;
  const selectedLanguageCode = useCurrentLanguageCode();

  const onChangeSelectedLanguage = useCallback(
    (languageCode: SupportedLanguageCode): void => {
      changeLanguage(languageCode);

      void setSelectedLanguage(database, languageCode).catch((error) => {
        console.error("Failed to persist selected language.", error);
      });
    },
    [database],
  );

  return useMemo<LanguageSelectionViewModel>(
    () => ({
      selectedLanguageCode,
      options: SUPPORTED_LANGUAGE_OPTIONS,
      onChangeSelectedLanguage,
    }),
    [selectedLanguageCode, onChangeSelectedLanguage],
  );
}
