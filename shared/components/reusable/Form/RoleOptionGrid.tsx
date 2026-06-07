import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Circle, CircleDot } from "lucide-react-native";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";

export type RoleOptionGridItem<TValue extends string> = {
  value: TValue;
  label: string;
  category: "default" | "custom";
};

type RoleOptionGridProps<TValue extends string> = {
  options: readonly RoleOptionGridItem<TValue>[];
  selectedValue: TValue | null;
  onSelect: (value: TValue) => void;
  disabled?: boolean;
  isOptionDisabled?: (value: TValue) => boolean;
  defaultCategoryLabel?: string;
  customCategoryLabel?: string;
};

type RoleCategorySectionProps<TValue extends string> = {
  title: string;
  options: readonly RoleOptionGridItem<TValue>[];
  selectedValue: TValue | null;
  onSelect: (value: TValue) => void;
  disabled?: boolean;
  isOptionDisabled?: (value: TValue) => boolean;
};

function RoleCategorySection<TValue extends string>({
  title,
  options,
  selectedValue,
  onSelect,
  disabled,
  isOptionDisabled,
}: RoleCategorySectionProps<TValue>) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  if (options.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView
        horizontal={true}
        alwaysBounceVertical={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {options.map((option) => {
          const isSelected = option.value === selectedValue;
          const optionDisabled =
            disabled || isOptionDisabled?.(option.value) === true;

          return (
            <Pressable
              key={option.value}
              style={[
                styles.optionCard,
                isSelected ? styles.optionCardSelected : null,
                optionDisabled ? styles.optionCardDisabled : null,
              ]}
              onPress={() => onSelect(option.value)}
              disabled={optionDisabled}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.optionLabel,
                  isSelected ? styles.optionLabelSelected : null,
                ]}
                numberOfLines={1}
              >
                {option.label}
              </Text>

              {isSelected ? (
                <CircleDot size={14} color={theme.colors.primaryForeground} />
              ) : (
                <Circle size={14} color={theme.colors.mutedForeground} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function RoleOptionGrid<TValue extends string>({
  options,
  selectedValue,
  onSelect,
  disabled,
  isOptionDisabled,
  defaultCategoryLabel = "Default Roles",
  customCategoryLabel = "Custom Roles",
}: RoleOptionGridProps<TValue>) {
  const styles = useThemedStyles(createStyles);
  const defaultOptions = useMemo(
    () => options.filter((option) => option.category === "default"),
    [options],
  );
  const customOptions = useMemo(
    () => options.filter((option) => option.category === "custom"),
    [options],
  );

  return (
    <View style={styles.wrap}>
      <RoleCategorySection
        title={defaultCategoryLabel}
        options={defaultOptions}
        selectedValue={selectedValue}
        onSelect={onSelect}
        disabled={disabled}
        isOptionDisabled={isOptionDisabled}
      />
      <RoleCategorySection
        title={customCategoryLabel}
        options={customOptions}
        selectedValue={selectedValue}
        onSelect={onSelect}
        disabled={disabled}
        isOptionDisabled={isOptionDisabled}
      />
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    wrap: {
      gap: theme.scaleSpace(spacing.sm),
    },
    sectionWrap: {
      gap: theme.scaleSpace(spacing.xs),
    },
    sectionTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterBold",
    },
    row: {
      gap: theme.scaleSpace(spacing.xs),
      alignItems: "center",
      paddingVertical: theme.scaleSpace(2),
      paddingRight: theme.scaleSpace(spacing.md),
    },
    optionCard: {
      minHeight: theme.scaleSpace(38),
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.pill,
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.scaleSpace(spacing.xs),
    },
    optionCardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    optionCardDisabled: {
      opacity: 0.45,
    },
    optionLabel: {
      color: theme.colors.foreground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterSemiBold",
      flexShrink: 1,
    },
    optionLabelSelected: {
      color: theme.colors.primaryForeground,
    },
  });
