import React from "react";
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";

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
  scrollStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function ChipSelectorField<TValue extends string>({
  label,
  options,
  selectedValue,
  onSelect,
  disabled,
  isOptionDisabled,
  scrollStyle,
  contentContainerStyle,
}: ChipSelectorFieldProps<TValue>) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        horizontal={true}
        style={scrollStyle}
        alwaysBounceVertical={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.optionsRow, contentContainerStyle]}
      >
        {options.map((option) => {
          const isSelected = option.value === selectedValue;
          const optionDisabled =
            disabled || isOptionDisabled?.(option.value) === true;

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

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    wrap: {
      gap: theme.scaleSpace(spacing.xs),
    },
    label: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(11),
      lineHeight: theme.scaleLineHeight(14),
      fontFamily: "InterBold",
      textTransform: "uppercase",
      letterSpacing: 0.45,
    },
    optionsRow: {
      gap: theme.scaleSpace(spacing.xs),
      alignItems: "center",
      paddingVertical: theme.scaleSpace(2),
      paddingRight: theme.scaleSpace(spacing.md),
    },
    chip: {
      minHeight: theme.scaleSpace(36),
      paddingHorizontal: theme.scaleSpace(14),
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    chipSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    chipDisabled: {
      opacity: 0.45,
    },
    chipText: {
      color: theme.colors.foreground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterSemiBold",
    },
    chipTextSelected: {
      color: theme.colors.primaryForeground,
    },
  });
