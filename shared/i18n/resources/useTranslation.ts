import React from "react";
import type { SupportedLanguageCode } from "./types";
import {
  getCurrentLanguage,
  subscribeToLanguageChange,
  translate,
} from "./i18n";

type UseTranslationResult = {
  t: (key: string) => string;
  languageCode: SupportedLanguageCode;
};

export const useTranslation = (): UseTranslationResult => {
  const [language, setLanguage] =
    React.useState<SupportedLanguageCode>(getCurrentLanguage());

  React.useEffect(() => {
    const unsubscribe = subscribeToLanguageChange(() => {
      setLanguage(getCurrentLanguage());
    });

    return unsubscribe;
  }, []);

  return {
    t: translate,
    languageCode: language,
  };
};
