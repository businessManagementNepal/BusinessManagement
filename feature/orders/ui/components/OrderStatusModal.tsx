import { OrderStatusValue } from "@/feature/orders/types/order.types";
import { DropdownOption } from "@/shared/components/reusable/DropDown/Dropdown";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import { CheckCircle2 } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  value: OrderStatusValue;
  options: DropdownOption[];
  onChange: (value: OrderStatusValue) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
};

export function OrderStatusModal({
  visible,
  value,
  options,
  onChange,
  onClose,
  onSubmit,
}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <FormSheetModal
      visible={visible}
      title="Change Status"
      onClose={onClose}
      presentation="dialog"
      contentContainerStyle={styles.content}
      scrollEnabled={false}
    >
      <View style={styles.optionList}>
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <Pressable
              key={option.value}
              style={[styles.optionRow, isSelected ? styles.optionRowSelected : null]}
              onPress={() => {
                onChange(option.value as OrderStatusValue);
                if (!isSelected) {
                  void onSubmit();
                }
              }}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.optionLabel,
                  isSelected ? styles.optionLabelSelected : null,
                ]}
              >
                {option.label}
              </Text>
              {isSelected ? (
                <CheckCircle2 size={16} color={theme.colors.primaryForeground} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </FormSheetModal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    content: {
      gap: theme.scaleSpace(spacing.sm),
    },
    optionList: {
      gap: theme.scaleSpace(spacing.sm),
    },
    optionRow: {
      minHeight: theme.scaleSpace(50),
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.scaleSpace(spacing.sm),
    },
    optionRowSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    optionLabel: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(17),
      fontFamily: "InterSemiBold",
    },
    optionLabelSelected: {
      color: theme.colors.primaryForeground,
      fontFamily: "InterBold",
    },
  });
