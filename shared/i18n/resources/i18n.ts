import en from "./en";
import hi from "./hi";
import ne from "./ne";
import {
  FALLBACK_LANGUAGE,
  SUPPORTED_LANGUAGE_CODES,
  SupportedLanguageCode,
  TranslationTree,
  TranslationValue,
} from "./types";

type TranslationResources = Record<SupportedLanguageCode, TranslationTree>;

const resources: TranslationResources = {
  en,
  ne,
  hi,
};

let currentLanguage: SupportedLanguageCode = FALLBACK_LANGUAGE;

const listeners = new Set<() => void>();

const notifyListeners = (): void => {
  listeners.forEach((listener) => {
    listener();
  });
};

const readNestedValue = (
  tree: TranslationTree,
  keyParts: string[],
): string | null => {
  let currentNode: TranslationValue = tree;

  for (const keyPart of keyParts) {
    if (typeof currentNode === "string") {
      return null;
    }

    const nextNode: TranslationValue | undefined = currentNode[keyPart];

    if (nextNode === undefined) {
      return null;
    }

    currentNode = nextNode;
  }

  return typeof currentNode === "string" ? currentNode : null;
};

export const isSupportedLanguageCode = (
  languageCode: string,
): languageCode is SupportedLanguageCode => {
  return SUPPORTED_LANGUAGE_CODES.includes(
    languageCode as SupportedLanguageCode,
  );
};

export const getCurrentLanguage = (): SupportedLanguageCode => {
  return currentLanguage;
};

export const changeLanguage = (languageCode: SupportedLanguageCode): void => {
  if (currentLanguage === languageCode) {
    return;
  }

  currentLanguage = languageCode;
  notifyListeners();
};

export const translate = (translationKey: string): string => {
  const keyParts = translationKey.split(".");

  const currentResource = resources[currentLanguage];
  const currentTranslation = readNestedValue(currentResource, keyParts);

  if (currentTranslation !== null) {
    return currentTranslation;
  }

  const fallbackResource = resources[FALLBACK_LANGUAGE];
  const fallbackTranslation = readNestedValue(fallbackResource, keyParts);

  if (fallbackTranslation !== null) {
    return fallbackTranslation;
  }

  return translationKey;
};

export const subscribeToLanguageChange = (
  listener: () => void,
): (() => void) => {
  listeners.add(listener);

  return (): void => {
    listeners.delete(listener);
  };
};
