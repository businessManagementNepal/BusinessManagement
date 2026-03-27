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

export const useCurrentLanguageCode = (): SupportedLanguageCode => {
  const [languageCode, setLanguageCode] =
    React.useState<SupportedLanguageCode>(getCurrentLanguage());

  React.useEffect(() => {
    const unsubscribe = subscribeToLanguageChange(() => {
      setLanguageCode(getCurrentLanguage());
    });

    return unsubscribe;
  }, []);

  return languageCode;
};

export const useTranslation = (): UseTranslationResult => {
  const languageCode = useCurrentLanguageCode();

  return {
    t: translate,
    languageCode,
  };
};
