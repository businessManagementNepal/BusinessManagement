import {
  TaxCalculationModeValue,
  TaxToolPresetOption,
} from "@/feature/appSettings/taxCalculator/types/taxCalculator.types";

export type TaxCalculationSummaryState = {
  presetLabel: string;
  modeLabel: string;
  subtotalLabel: string;
  taxAmountLabel: string;
  totalAmountLabel: string;
};

export interface TaxCalculatorViewModel {
  isLoading: boolean;
  errorMessage: string | null;
  isCalculatorVisible: boolean;
  amountInput: string;
  amountInputPlaceholder: string;
  selectedPresetCode: string;
  selectedMode: TaxCalculationModeValue;
  presetOptions: readonly TaxToolPresetOption[];
  calculationSummary: TaxCalculationSummaryState | null;
  onRefresh: () => Promise<void>;
  onOpenCalculator: () => void;
  onCloseCalculator: () => void;
  onAmountChange: (value: string) => void;
  onPresetChange: (value: string) => void;
  onModeChange: (value: TaxCalculationModeValue) => void;
}

type TaxCalculatorScreenCopy = {
  settingsSectionTitle: string;
  taxToolTitle: string;
  taxToolSubtitle: string;
};

export type TaxCalculatorScreenViewModel = TaxCalculatorViewModel &
  TaxCalculatorScreenCopy;
