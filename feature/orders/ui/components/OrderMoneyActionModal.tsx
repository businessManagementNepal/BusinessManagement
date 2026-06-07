import {
  OrderMoneyActionValue,
  OrderMoneyFormState,
} from "@/feature/orders/types/order.state.types";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import {
  Dropdown,
  DropdownOption,
} from "@/shared/components/reusable/DropDown/Dropdown";
import { DualCalendarDatePicker } from "@/shared/components/reusable/Form/DualCalendarDatePicker";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  form: OrderMoneyFormState;
  moneyAccountOptions: DropdownOption[];
  onClose: () => void;
  onChange: (
    field: keyof Omit<OrderMoneyFormState, "visible" | "action" | "fieldErrors">,
    value: string,
  ) => void;
  onSubmit: () => Promise<void>;
};

const getTitle = (action: OrderMoneyActionValue): string =>
  action === "payment" ? "Record Order Payment" : "Order Refund";

const getSubmitLabel = (action: OrderMoneyActionValue): string =>
  action === "payment" ? "Record Payment" : "Save Refund";

export function OrderMoneyActionModal({
  form,
  moneyAccountOptions,
  onClose,
  onChange,
  onSubmit,
}: Props) {
  const styles = useThemedStyles(createStyles);

  return (
    <FormSheetModal
      visible={form.visible}
      title={getTitle(form.action)}
      subtitle={form.orderNumber ? `Order ${form.orderNumber}` : undefined}
      onClose={onClose}
      presentation="dialog"
      contentContainerStyle={styles.content}
    >
      <LabeledTextInput
        label="Amount *"
        value={form.amount}
        onChangeText={(value) => onChange("amount", value)}
        keyboardType="decimal-pad"
        placeholder="Enter amount"
        errorText={form.fieldErrors.amount}
      />
      <DualCalendarDatePicker
        label="Date *"
        value={form.happenedAt}
        onChangeText={(value) => onChange("happenedAt", value)}
        placeholder="YYYY-MM-DD"
        errorText={form.fieldErrors.happenedAt}
      />

      <Text style={styles.label}>Money Account *</Text>
      <Dropdown
        value={form.settlementMoneyAccountRemoteId}
        options={moneyAccountOptions}
        onChange={(value) => onChange("settlementMoneyAccountRemoteId", value)}
        placeholder="Select money account"
        modalTitle="Select money account"
        showLeadingIcon={false}
      />
      {form.fieldErrors.settlementMoneyAccountRemoteId ? (
        <Text style={styles.errorText}>
          {form.fieldErrors.settlementMoneyAccountRemoteId}
        </Text>
      ) : null}

      <LabeledTextInput
        label="Note"
        value={form.note}
        onChangeText={(value) => onChange("note", value)}
        placeholder="Optional note"
        multiline
      />

      <View style={styles.actionRow}>
        <AppButton
          label="Cancel"
          variant="secondary"
          style={styles.actionButton}
          onPress={onClose}
        />
        <AppButton
          label={getSubmitLabel(form.action)}
          style={styles.actionButton}
          onPress={() => void onSubmit()}
        />
      </View>
    </FormSheetModal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    content: {
      gap: theme.scaleSpace(spacing.sm),
    },
    label: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      marginBottom: theme.scaleSpace(-4),
    },
    errorText: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterMedium",
      marginTop: theme.scaleSpace(-2),
    },
    actionRow: {
      flexDirection: "row",
      gap: theme.scaleSpace(spacing.sm),
    },
    actionButton: {
      flex: 1,
    },
  });
