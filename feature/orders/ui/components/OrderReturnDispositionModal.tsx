import { OrderReturnDispositionFormState } from "@/feature/orders/types/order.state.types";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { StickyActionFooter } from "@/shared/components/reusable/Form/StickyActionFooter";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  form: OrderReturnDispositionFormState;
  canManage: boolean;
  onClose: () => void;
  onChange: (
    lineRemoteId: string,
    field: "sellableQuantity" | "nonSellableQuantity",
    value: string,
  ) => void;
  onSubmit: () => Promise<void>;
};

export function OrderReturnDispositionModal({
  form,
  canManage,
  onClose,
  onChange,
  onSubmit,
}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <FormSheetModal
      visible={form.visible}
      title="Return Items"
      subtitle={
        form.orderNumber
          ? `${form.orderNumber} · Split each returned item by condition`
          : "Split each returned item by condition"
      }
      onClose={onClose}
      closeAccessibilityLabel="Close return disposition"
      presentation="bottom-sheet"
      contentContainerStyle={styles.content}
      footer={
        <StickyActionFooter>
          <AppButton
            label="Cancel"
            variant="secondary"
            size="lg"
            style={styles.actionButton}
            onPress={onClose}
          />
          <AppButton
            label="Confirm Return"
            size="lg"
            style={styles.actionButton}
            onPress={() => {
              void onSubmit();
            }}
            disabled={!canManage}
          />
        </StickyActionFooter>
      }
    >
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Inventory effect</Text>
        <Text style={styles.infoText}>
          Sellable quantity is added back to available inventory. Damaged or
          non-sellable quantity is recorded for audit only and does not increase
          available stock.
        </Text>
      </View>

      {form.lines.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No inventory-tracked items</Text>
          <Text style={styles.emptyText}>
            This order can be returned without changing inventory.
          </Text>
        </View>
      ) : (
        form.lines.map((line) => (
          <View key={line.lineRemoteId} style={styles.lineCard}>
            <View style={styles.lineHeader}>
              <View style={styles.lineHeaderBody}>
                <Text style={styles.productName}>{line.productName}</Text>
                <Text style={styles.quantityMeta}>
                  Delivered: {line.orderedQuantity} {line.unitLabel ?? "unit"}
                </Text>
              </View>
            </View>

            <View style={styles.quantityRow}>
              <View style={styles.quantityField}>
                <LabeledTextInput
                  label="Sellable"
                  value={line.sellableQuantity}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  onChangeText={(value) =>
                    onChange(line.lineRemoteId, "sellableQuantity", value)
                  }
                />
              </View>
              <View style={styles.quantityField}>
                <LabeledTextInput
                  label="Damaged / Non-sellable"
                  value={line.nonSellableQuantity}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  onChangeText={(value) =>
                    onChange(line.lineRemoteId, "nonSellableQuantity", value)
                  }
                />
              </View>
            </View>

            {line.errorMessage ? (
              <Text style={styles.errorText}>{line.errorMessage}</Text>
            ) : (
              <Text style={styles.helperText}>
                Sellable + non-sellable must equal {line.orderedQuantity}{" "}
                {line.unitLabel ?? "unit"}.
              </Text>
            )}
          </View>
        ))
      )}
    </FormSheetModal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    content: {
      gap: theme.scaleSpace(spacing.md),
      paddingBottom: theme.scaleSpace(spacing.xl),
    },
    infoCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.lg,
      backgroundColor: theme.colors.accent,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.md),
      gap: theme.scaleSpace(4),
    },
    infoTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterBold",
    },
    infoText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
      lineHeight: theme.scaleLineHeight(19),
      fontFamily: "InterMedium",
    },
    emptyCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.lg,
      backgroundColor: theme.colors.card,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.lg),
      gap: theme.scaleSpace(4),
    },
    emptyTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(15),
      fontFamily: "InterBold",
    },
    emptyText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
      fontFamily: "InterMedium",
    },
    lineCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.lg,
      backgroundColor: theme.colors.card,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.md),
      gap: theme.scaleSpace(spacing.sm),
    },
    lineHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.sm),
    },
    lineHeaderBody: {
      flex: 1,
      gap: theme.scaleSpace(2),
    },
    productName: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(15),
      fontFamily: "InterBold",
    },
    quantityMeta: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      fontFamily: "InterMedium",
    },
    quantityRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.scaleSpace(spacing.sm),
    },
    quantityField: {
      flex: 1,
    },
    helperText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      fontFamily: "InterMedium",
    },
    errorText: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(12),
      fontFamily: "InterSemiBold",
    },
    actionButton: {
      flex: 1,
    },
  });
