import {
  SupportedLanguageCode,
  SupportedLanguageOption,
} from "@/shared/i18n/resources";

export interface LanguageSelectionViewModel {
  selectedLanguageCode: SupportedLanguageCode;
  options: readonly SupportedLanguageOption[];
  onChangeSelectedLanguage: (languageCode: SupportedLanguageCode) => void;
}
