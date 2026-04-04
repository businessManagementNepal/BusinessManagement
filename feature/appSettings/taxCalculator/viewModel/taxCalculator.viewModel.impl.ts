import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TaxBreakdown,
  TaxCalculationMode,
  TaxCalculationModeValue,
  TaxToolPreset,
} from "@/feature/appSettings/taxCalculator/types/taxCalculator.types";
import { CalculateTaxBreakdownUseCase } from "@/feature/appSettings/taxCalculator/useCase/calculateTaxBreakdown.useCase";
import { GetTaxCalculatorPresetsUseCase } from "@/feature/appSettings/taxCalculator/useCase/getTaxCalculatorPresets.useCase";
import {
  TaxCalculatorScreenViewModel,
  TaxCalculationSummaryState,
} from "./taxCalculator.viewModel";
import {
  formatCurrencyAmount,
  resolveCurrencyCode,
  resolveCurrencyPrefix,
} from "@/shared/utils/currency/accountCurrency";

const parseAmountInput = (value: string): number | null => {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
};

const buildCalculationSummary = (
  breakdown: TaxBreakdown,
  currencyCode: string,
  countryCode: string | null,
): TaxCalculationSummaryState => ({
  presetLabel: breakdown.presetLabel,
  modeLabel:
    breakdown.mode === TaxCalculationMode.Inclusive
      ? "Tax Inclusive"
      : "Tax Exclusive",
  subtotalLabel: formatCurrencyAmount({
    amount: breakdown.subtotalAmount,
    currencyCode,
    countryCode,
    maximumFractionDigits: 2,
  }),
  taxAmountLabel: formatCurrencyAmount({
    amount: breakdown.taxAmount,
    currencyCode,
    countryCode,
    maximumFractionDigits: 2,
  }),
  totalAmountLabel: formatCurrencyAmount({
    amount: breakdown.totalAmount,
    currencyCode,
    countryCode,
    maximumFractionDigits: 2,
  }),
});

type Params = {
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  getTaxCalculatorPresetsUseCase: GetTaxCalculatorPresetsUseCase;
  calculateTaxBreakdownUseCase: CalculateTaxBreakdownUseCase;
};

export const useTaxCalculatorViewModel = ({
  activeAccountCurrencyCode,
  activeAccountCountryCode,
  getTaxCalculatorPresetsUseCase,
  calculateTaxBreakdownUseCase,
}: Params): TaxCalculatorScreenViewModel => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [calculationErrorMessage, setCalculationErrorMessage] =
    useState<string | null>(null);
  const [presets, setPresets] = useState<readonly TaxToolPreset[]>([]);
  const [selectedPresetCode, setSelectedPresetCode] = useState("");
  const [selectedMode, setSelectedMode] = useState<TaxCalculationModeValue>(
    TaxCalculationMode.Exclusive,
  );
  const [amountInput, setAmountInput] = useState("");
  const [calculationSummary, setCalculationSummary] =
    useState<TaxCalculationSummaryState | null>(null);
  const [isCalculatorVisible, setIsCalculatorVisible] = useState(false);
  const currencyCode = useMemo(
    () =>
      resolveCurrencyCode({
        currencyCode: activeAccountCurrencyCode,
        countryCode: activeAccountCountryCode,
      }),
    [activeAccountCountryCode, activeAccountCurrencyCode],
  );
  const amountInputPlaceholder = useMemo(() => {
    const currencyPrefix = resolveCurrencyPrefix({
      currencyCode,
      countryCode: activeAccountCountryCode,
    });
    return `Enter Amount (${currencyPrefix})`;
  }, [activeAccountCountryCode, currencyCode]);

  const loadPresets = useCallback(async () => {
    setIsLoading(true);
    const result = await getTaxCalculatorPresetsUseCase.execute();

    if (!result.success) {
      setPresets([]);
      setSelectedPresetCode("");
      setLoadErrorMessage(result.error.message);
      setCalculationErrorMessage(null);
      setCalculationSummary(null);
      setIsLoading(false);
      return;
    }

    setPresets(result.value);
    setSelectedPresetCode((current) => {
      if (current && result.value.some((preset) => preset.code === current)) {
        return current;
      }

      return result.value[2]?.code ?? result.value[0]?.code ?? "";
    });
    setLoadErrorMessage(null);
    setCalculationErrorMessage(null);
    setIsLoading(false);
  }, [getTaxCalculatorPresetsUseCase]);

  useEffect(() => {
    void loadPresets();
  }, [loadPresets]);

  useEffect(() => {
    if (loadErrorMessage) {
      setCalculationSummary(null);
      setCalculationErrorMessage(null);
      return;
    }

    const amount = parseAmountInput(amountInput);

    if (amount === null) {
      setCalculationSummary(null);
      if (amountInput.trim()) {
        setCalculationErrorMessage("Enter a valid amount greater than zero.");
      } else {
        setCalculationErrorMessage(null);
      }
      return;
    }

    if (!selectedPresetCode) {
      setCalculationSummary(null);
      if (!isLoading) {
        setCalculationErrorMessage("Select a tax preset to continue.");
      }
      return;
    }

    let isMounted = true;

    const calculate = async () => {
      const result = await calculateTaxBreakdownUseCase.execute({
        amount,
        presetCode: selectedPresetCode,
        mode: selectedMode,
      });

      if (!isMounted) {
        return;
      }

      if (!result.success) {
        setCalculationSummary(null);
        setCalculationErrorMessage(result.error.message);
        return;
      }

      setCalculationSummary(
        buildCalculationSummary(
          result.value,
          currencyCode,
          activeAccountCountryCode,
        ),
      );
      setCalculationErrorMessage(null);
    };

    void calculate();

    return () => {
      isMounted = false;
    };
  }, [
    amountInput,
    activeAccountCountryCode,
    calculateTaxBreakdownUseCase,
    currencyCode,
    isLoading,
    loadErrorMessage,
    selectedMode,
    selectedPresetCode,
  ]);

  const presetOptions = useMemo(
    () => presets.map((preset) => ({ label: preset.label, value: preset.code })),
    [presets],
  );

  const onOpenCalculator = useCallback(() => {
    if (presets.length === 0) {
      return;
    }

    setIsCalculatorVisible(true);
  }, [presets.length]);

  const onCloseCalculator = useCallback(() => {
    setIsCalculatorVisible(false);
  }, []);

  const onAmountChange = useCallback((value: string) => {
    setAmountInput(value);
  }, []);

  const onPresetChange = useCallback((value: string) => {
    setSelectedPresetCode(value);
  }, []);

  const onModeChange = useCallback((value: TaxCalculationModeValue) => {
    setSelectedMode(value);
  }, []);

  const errorMessage = calculationErrorMessage ?? loadErrorMessage;

  return useMemo(
    () => ({
      isLoading,
      errorMessage,
      isCalculatorVisible,
      amountInput,
      amountInputPlaceholder,
      selectedPresetCode,
      selectedMode,
      presetOptions,
      calculationSummary,
      settingsSectionTitle: "Tools",
      taxToolTitle: "Tax / GST / VAT Calculator",
      taxToolSubtitle: "Calculate tax on amounts",
      onRefresh: loadPresets,
      onOpenCalculator,
      onCloseCalculator,
      onAmountChange,
      onPresetChange,
      onModeChange,
    }),
    [
      amountInput,
      amountInputPlaceholder,
      calculationSummary,
      calculationErrorMessage,
      errorMessage,
      isCalculatorVisible,
      isLoading,
      loadErrorMessage,
      loadPresets,
      onAmountChange,
      onCloseCalculator,
      onModeChange,
      onOpenCalculator,
      onPresetChange,
      presetOptions,
      selectedMode,
      selectedPresetCode,
    ],
  );
};
