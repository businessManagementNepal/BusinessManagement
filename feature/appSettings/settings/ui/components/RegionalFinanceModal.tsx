import { SettingsViewModel } from "@/feature/appSettings/settings/viewModel/settings.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledDropdownField } from "@/shared/components/reusable/Form/LabeledDropdownField";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type RegionalFinanceModalProps = {
  visible: boolean;
  isSaving: boolean;
  title: string;
  subtitle: string;
  errorMessage: string | null;
  settings: SettingsViewModel["regionalFinanceSettings"];
  countryOptions: SettingsViewModel["regionalFinanceCountryOptions"];
  currencyOptions: SettingsViewModel["regionalFinanceCurrencyOptions"];
  taxRateOptions: SettingsViewModel["regionalFinanceTaxRateOptions"];
  taxModeOptions: SettingsViewModel["regionalFinanceTaxModeOptions"];
  onClose: () => void;
  onChangeCountry: (value: string) => void;
  onChangeCurrency: (value: string) => void;
  onChangeTaxRate: (value: string) => void;
  onChangeTaxMode: (value: string) => void;
  onSave: () => Promise<void>;
};

export function RegionalFinanceModal({
  visible,
  isSaving,
  title,
  subtitle,
  errorMessage,
  settings,
  countryOptions,
  currencyOptions,
  taxRateOptions,
  taxModeOptions,
  onClose,
  onChangeCountry,
  onChangeCurrency,
  onChangeTaxRate,
  onChangeTaxMode,
  onSave,
}: RegionalFinanceModalProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <FormSheetModal
      visible={visible}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      closeAccessibilityLabel="Close regional finance settings"
      presentation="bottom-sheet"
      contentContainerStyle={styles.content}
      footer={
        <View style={styles.footer}>
          <AppButton
            label="Cancel"
            variant="secondary"
            size="lg"
            style={styles.footerButton}
            onPress={onClose}
          />
          <AppButton
            label={isSaving ? "Saving..." : "Save"}
            size="lg"
            style={styles.footerButton}
            onPress={() => {
              void onSave();
            }}
            disabled={isSaving}
            accessibilityState={{ busy: isSaving }}
          />
        </View>
      }
    >
      <LabeledDropdownField
        label="Country"
        value={settings.countryCode}
        options={countryOptions}
        onChange={onChangeCountry}
        placeholder="Select country"
        modalTitle="Select country"
        disabled={isSaving}
      />

      <LabeledDropdownField
        label="Currency"
        value={settings.currencyCode}
        options={currencyOptions}
        onChange={onChangeCurrency}
        placeholder="Select currency"
        modalTitle="Select currency"
        disabled={isSaving}
      />

      <LabeledDropdownField
        label="Default Tax Rate"
        value={String(settings.defaultTaxRatePercent)}
        options={taxRateOptions}
        onChange={onChangeTaxRate}
        placeholder="Select tax rate"
        modalTitle="Select default tax rate"
        disabled={isSaving}
      />

      <LabeledDropdownField
        label="Tax Mode"
        value={settings.taxMode}
        options={taxModeOptions}
        onChange={onChangeTaxMode}
        placeholder="Select tax mode"
        modalTitle="Select tax mode"
        disabled={isSaving}
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </FormSheetModal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    content: {
      gap: theme.scaleSpace(spacing.sm),
    },
    errorText: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(13),
      fontFamily: "InterSemiBold",
    },
    footer: {
      flexDirection: "row",
      gap: theme.scaleSpace(spacing.sm),
    },
    footerButton: {
      flex: 1,
    },
  });
