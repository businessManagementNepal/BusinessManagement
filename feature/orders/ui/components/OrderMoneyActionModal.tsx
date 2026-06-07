import {
  OrderMoneyActionValue,
  OrderMoneyFormState,
} from "@/feature/orders/types/order.state.types";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import {
  DefaultSection,
  MoreDetailsSection,
} from "@/shared/components/reusable/Form/FormSections";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledDropdownField } from "@/shared/components/reusable/Form/LabeledDropdownField";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { StickyActionFooter } from "@/shared/components/reusable/Form/StickyActionFooter";
import { DropdownOption } from "@/shared/components/reusable/DropDown/Dropdown";
import { DualCalendarDatePicker } from "@/shared/components/reusable/Form/DualCalendarDatePicker";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import React from "react";
import { StyleSheet } from "react-native";

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
  const shouldExpandMoreDetails = form.note.trim().length > 0;

  return (
    <FormSheetModal
      visible={form.visible}
      title={getTitle(form.action)}
      subtitle={form.orderNumber ? `Order ${form.orderNumber}` : undefined}
      onClose={onClose}
      presentation="dialog"
      contentContainerStyle={styles.content}
      footer={
        <StickyActionFooter>
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
        </StickyActionFooter>
      }
    >
      <DefaultSection
        title="Money Details"
        subtitle="Amount, date, and money account stay visible by default."
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

        <LabeledDropdownField
          label="Money Account *"
          value={form.settlementMoneyAccountRemoteId}
          options={moneyAccountOptions}
          onChange={(value) => onChange("settlementMoneyAccountRemoteId", value)}
          placeholder="Select money account"
          modalTitle="Select money account"
          errorText={form.fieldErrors.settlementMoneyAccountRemoteId}
        />
      </DefaultSection>

      <MoreDetailsSection
        title="More Details"
        subtitle="Optional payment or refund note."
        defaultExpanded={shouldExpandMoreDetails}
      >
        <LabeledTextInput
          label="Note"
          value={form.note}
          onChangeText={(value) => onChange("note", value)}
          placeholder="Optional note"
          multiline={true}
          numberOfLines={4}
        />
      </MoreDetailsSection>
    </FormSheetModal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    content: {
      gap: theme.scaleSpace(spacing.md),
    },
    actionButton: {
      flex: 1,
    },
  });
