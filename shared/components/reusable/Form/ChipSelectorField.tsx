import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";

export type ChipSelectorOption<TValue extends string> = {
  value: TValue;
  label: string;
};

type ChipSelectorFieldProps<TValue extends string> = {
  label: string;
  options: readonly ChipSelectorOption<TValue>[];
  selectedValue: TValue | null;
  onSelect: (value: TValue) => void;
  disabled?: boolean;
  isOptionDisabled?: (value: TValue) => boolean;
};

export function ChipSelectorField<TValue extends string>({
  label,
  options,
  selectedValue,
  onSelect,
  disabled,
  isOptionDisabled,
}: ChipSelectorFieldProps<TValue>) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionsRow}
      >
        {options.map((option) => {
          const isSelected = option.value === selectedValue;
          const optionDisabled = disabled || isOptionDisabled?.(option.value) === true;

          return (
            <Pressable
              key={option.value}
              style={[
                styles.chip,
                isSelected ? styles.chipSelected : null,
                optionDisabled ? styles.chipDisabled : null,
              ]}
              onPress={() => onSelect(option.value)}
              disabled={optionDisabled}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected ? styles.chipTextSelected : null,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterBold",
    marginBottom: spacing.xs,
  },
  optionsRow: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  chip: {
    minHeight: 30,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipDisabled: {
    opacity: 0.45,
  },
  chipText: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 14,
    fontFamily: "InterSemiBold",
  },
  chipTextSelected: {
    color: colors.primaryForeground,
  },
});
