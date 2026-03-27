export const SUPPORTED_LANGUAGE_CODES = ["en", "ne", "hi"] as const;

export type SupportedLanguageCode =
  (typeof SUPPORTED_LANGUAGE_CODES)[number];

export const FALLBACK_LANGUAGE: SupportedLanguageCode = "en";

export type TranslationValue = string | TranslationTree;

export type TranslationTree = {
  [key: string]: TranslationValue;
};

export type SupportedLanguageOption = {
  code: SupportedLanguageCode;
  label: string;
};

export const SUPPORTED_LANGUAGE_OPTIONS: readonly SupportedLanguageOption[] = [
  {
    code: "en",
    label: "English",
  },
  {
    code: "ne",
    label: "नेपाली",
  },
  {
    code: "hi",
    label: "हिन्दी",
  },
];
