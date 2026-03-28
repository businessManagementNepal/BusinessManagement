import { Database } from "@nozbe/watermelondb";
import { useLanguageSelectionFeature } from "@/feature/appSettings/hooks/useLanguageSelectionFeature";
import { AuthEntryLanguageViewModel } from "./authEntry.language.viewModel";

type UseAuthEntryLanguageViewModelParams = {
  database: Database;
};

export const useAuthEntryLanguageViewModel = (
  params: UseAuthEntryLanguageViewModelParams,
): AuthEntryLanguageViewModel => {
  const { database } = params;
  return useLanguageSelectionFeature({ database });
};
