import { Dropdown, DropdownOption } from "@/shared/components/reusable/DropDown/Dropdown";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type BudgetMonthPickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  errorText?: string;
};

const MONTH_OPTIONS: readonly DropdownOption[] = [
  { label: "January", value: "01" },
  { label: "February", value: "02" },
  { label: "March", value: "03" },
  { label: "April", value: "04" },
  { label: "May", value: "05" },
  { label: "June", value: "06" },
  { label: "July", value: "07" },
  { label: "August", value: "08" },
  { label: "September", value: "09" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
] as const;

const YEAR_OPTIONS: readonly DropdownOption[] = Array.from(
  { length: 101 },
  (_, index) => {
    const year = String(2000 + index);
    return {
      label: year,
      value: year,
    };
  },
);

const getCurrentBudgetMonthParts = (): {
  year: string;
  month: string;
} => {
  const now = new Date();

  return {
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1).padStart(2, "0"),
  };
};

const getBudgetMonthParts = (
  value: string,
): {
  year: string;
  month: string;
} => {
  const normalizedValue = value.trim();
  const match = /^(\d{4})-(\d{2})$/.exec(normalizedValue);

  if (!match) {
    return getCurrentBudgetMonthParts();
  }

  const month = Number(match[2]);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return getCurrentBudgetMonthParts();
  }

  return {
    year: match[1],
    month: match[2],
  };
};

const buildBudgetMonthValue = (year: string, month: string): string =>
  `${year}-${month}`;

const getBudgetMonthLabel = (year: string, month: string): string => {
  const selectedMonth = MONTH_OPTIONS.find((option) => option.value === month);
  return selectedMonth ? `${selectedMonth.label} ${year}` : `${year}-${month}`;
};

export function BudgetMonthPickerField({
  label,
  value,
  onChange,
  disabled = false,
  errorText,
}: BudgetMonthPickerFieldProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const { year, month } = React.useMemo(() => getBudgetMonthParts(value), [value]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.row}>
        <View style={styles.field}>
          <Dropdown
            value={month}
            options={MONTH_OPTIONS}
            onChange={(nextMonth) => onChange(buildBudgetMonthValue(year, nextMonth))}
            placeholder="Month"
            modalTitle="Select month"
            disabled={disabled}
            showLeadingIcon={false}
          />
        </View>

        <View style={styles.field}>
          <Dropdown
            value={year}
            options={YEAR_OPTIONS}
            onChange={(nextYear) => onChange(buildBudgetMonthValue(nextYear, month))}
            placeholder="Year"
            modalTitle="Select year"
            disabled={disabled}
            showLeadingIcon={false}
          />
        </View>
      </View>

      {errorText ? (
        <Text style={styles.errorText}>{errorText}</Text>
      ) : (
        <Text style={styles.helperText}>
          {getBudgetMonthLabel(year, month)}
        </Text>
      )}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      gap: theme.scaleSpace(6),
    },
    label: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(11),
      lineHeight: theme.scaleLineHeight(14),
      fontFamily: "InterBold",
      textTransform: "uppercase",
      letterSpacing: 0.45,
    },
    row: {
      flexDirection: "row",
      gap: theme.scaleSpace(spacing.sm),
    },
    field: {
      flex: 1,
      borderRadius: radius.lg,
    },
    helperText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterMedium",
    },
    errorText: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterSemiBold",
    },
  });
