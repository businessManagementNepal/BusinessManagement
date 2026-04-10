import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CalendarDays, FileDown, Plus, Printer, Trash2 } from "lucide-react-native";
import { Dropdown } from "@/shared/components/reusable/DropDown/Dropdown";
import { AppTextInput } from "@/shared/components/reusable/Form/AppTextInput";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import {
  BillingDocumentFormState,
  BillingLineItemFormState,
} from "@/feature/billing/viewModel/billing.viewModel";
import {
  BILLING_STATUS_OPTIONS,
  BILLING_TEMPLATE_OPTIONS,
} from "@/feature/billing/types/billing.types";
import { formatCurrencyAmount } from "@/shared/utils/currency/accountCurrency";

export function BillingDocumentEditorModal({
  visible,
  title,
  form,
  canManage,
  onClose,
  onChange,
  onLineItemChange,
  onAddLineItem,
  onRemoveLineItem,
  onSubmit,
  onPrintPreview,
  onExportPdf,
  currencyCode,
  countryCode,
  taxLabel,
  taxRateOptions,
  draftTotals,
}: {
  visible: boolean;
  title: string;
  form: BillingDocumentFormState;
  canManage: boolean;
  onClose: () => void;
  onChange: (
    field: keyof Omit<BillingDocumentFormState, "items">,
    value: string,
  ) => void;
  onLineItemChange: (
    remoteId: string,
    field: keyof BillingLineItemFormState,
    value: string,
  ) => void;
  onAddLineItem: () => void;
  onRemoveLineItem: (remoteId: string) => void;
  onSubmit: () => Promise<void>;
  onPrintPreview: () => void;
  onExportPdf: () => void;
  currencyCode: string;
  countryCode: string | null;
  taxLabel: string;
  taxRateOptions: readonly string[];
  draftTotals: { subtotalAmount: number; taxAmount: number; totalAmount: number };
}) {
  const lineItems = Array.isArray(form.items) ? form.items : [];

  return (
    <FormSheetModal
      visible={visible}
      title={title}
      subtitle="Manage billing document details"
      onClose={onClose}
      closeAccessibilityLabel="Close billing editor"
      presentation="dialog"
      contentContainerStyle={styles.formWrap}
      footer={
        <FormModalActionFooter style={styles.actionFooter}>
          <AppButton
            label="Save"
            size="lg"
            style={styles.primaryActionButton}
            onPress={() => void onSubmit()}
            disabled={!canManage}
          />
          <AppButton
            label="Print"
            size="lg"
            variant="secondary"
            style={styles.utilityActionButton}
            leadingIcon={<Printer size={16} color={colors.primary} />}
            onPress={onPrintPreview}
          />
          <AppButton
            label="PDF"
            size="lg"
            variant="secondary"
            style={styles.utilityActionButton}
            leadingIcon={<FileDown size={16} color={colors.primary} />}
            onPress={onExportPdf}
          />
        </FormModalActionFooter>
      }
    >
      <Text style={styles.label}>Customer Name</Text>
      <AppTextInput
        value={form.customerName}
        onChangeText={(value) => onChange("customerName", value)}
        placeholder="Enter customer name"
        editable={canManage}
      />

      <Text style={styles.label}>Template</Text>
      <Dropdown
        value={form.templateType}
        options={BILLING_TEMPLATE_OPTIONS.map((option) => ({
          label: option.label,
          value: option.value,
        }))}
        onChange={(value) => onChange("templateType", value)}
        showLeadingIcon={false}
        modalTitle="Select template"
        disabled={!canManage}
      />

      <Text style={styles.label}>Status</Text>
      <Dropdown
        value={form.status}
        options={BILLING_STATUS_OPTIONS.map((option) => ({
          label: option.label,
          value: option.value,
        }))}
        onChange={(value) => onChange("status", value)}
        showLeadingIcon={false}
        modalTitle="Select status"
        disabled={!canManage}
      />

      <Text style={styles.label}>Items</Text>
      {lineItems.map((item) => (
        <View key={item.remoteId} style={styles.lineItemWrap}>
          <View style={styles.lineItemRow}>
            <AppTextInput
              value={item.itemName}
              onChangeText={(value) => onLineItemChange(item.remoteId, "itemName", value)}
              placeholder="Item"
              containerStyle={styles.lineItemName}
              editable={canManage}
            />
            <AppTextInput
              value={item.quantity}
              onChangeText={(value) => onLineItemChange(item.remoteId, "quantity", value)}
              placeholder="1"
              keyboardType="decimal-pad"
              containerStyle={styles.lineItemQty}
              editable={canManage}
            />
            <AppTextInput
              value={item.unitRate}
              onChangeText={(value) => onLineItemChange(item.remoteId, "unitRate", value)}
              placeholder="Rate"
              keyboardType="decimal-pad"
              containerStyle={styles.lineItemRate}
              editable={canManage}
            />
            {lineItems.length > 1 ? (
              <Pressable
                style={styles.removeItemButton}
                onPress={() => onRemoveLineItem(item.remoteId)}
                disabled={!canManage}
              >
                <Trash2 size={16} color={colors.destructive} />
              </Pressable>
            ) : null}
          </View>
        </View>
      ))}

      <Pressable
        style={[styles.addItemRow, !canManage ? styles.disabledAction : null]}
        onPress={onAddLineItem}
        disabled={!canManage}
      >
        <Plus size={16} color={colors.primary} />
        <Text style={styles.addItemText}>Add Item</Text>
      </Pressable>

      <Text style={styles.label}>Tax Rate (%)</Text>
      <Dropdown
        value={form.taxRatePercent}
        options={taxRateOptions.map((option) => ({
          label: `${option}%`,
          value: option,
        }))}
        onChange={(value) => onChange("taxRatePercent", value)}
        showLeadingIcon={false}
        modalTitle="Select tax rate"
        disabled={!canManage}
      />

      <Text style={styles.label}>Issue Date</Text>
      <AppTextInput
        value={form.issuedAt}
        onChangeText={(value) => onChange("issuedAt", value)}
        placeholder="YYYY-MM-DD"
        leftIcon={<CalendarDays size={16} color={colors.mutedForeground} />}
        editable={canManage}
      />

      <Text style={styles.label}>Due Date</Text>
      <AppTextInput
        value={form.dueAt}
        onChangeText={(value) => onChange("dueAt", value)}
        placeholder="YYYY-MM-DD"
        leftIcon={<CalendarDays size={16} color={colors.mutedForeground} />}
        editable={canManage}
      />

      <Text style={styles.label}>Notes</Text>
      <AppTextInput
        value={form.notes}
        onChangeText={(value) => onChange("notes", value)}
        placeholder="Payment terms, thank you message..."
        multiline={true}
        containerStyle={styles.notesInput}
        style={styles.notesTextInput}
        editable={canManage}
      />

      <View style={styles.totalCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>
            {formatCurrencyAmount({
              amount: draftTotals.subtotalAmount,
              currencyCode,
              countryCode,
            })}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            {taxLabel} ({form.taxRatePercent || "0"}%)
          </Text>
          <Text style={styles.totalValue}>
            {formatCurrencyAmount({
              amount: draftTotals.taxAmount,
              currencyCode,
              countryCode,
            })}
          </Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalHeading}>Total</Text>
          <Text style={styles.totalHeadingValue}>
            {formatCurrencyAmount({
              amount: draftTotals.totalAmount,
              currencyCode,
              countryCode,
            })}
          </Text>
        </View>
      </View>
    </FormSheetModal>
  );
}

const styles = StyleSheet.create({
  formWrap: {
    gap: spacing.sm,
  },
  label: {
    color: colors.cardForeground,
    fontFamily: "InterSemiBold",
    fontSize: 14,
  },
  lineItemWrap: {
    gap: spacing.xs,
  },
  lineItemRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  lineItemName: {
    flex: 1,
  },
  lineItemQty: {
    width: 80,
  },
  lineItemRate: {
    width: 110,
  },
  removeItemButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
  },
  addItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: 4,
  },
  addItemText: {
    color: colors.primary,
    fontFamily: "InterBold",
    fontSize: 14,
  },
  notesInput: {
    minHeight: 96,
    alignItems: "flex-start",
  },
  notesTextInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  totalCard: {
    backgroundColor: colors.secondary,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    color: colors.mutedForeground,
    fontSize: 13,
  },
  totalValue: {
    color: colors.cardForeground,
    fontFamily: "InterSemiBold",
    fontSize: 13,
  },
  totalDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  totalHeading: {
    color: colors.cardForeground,
    fontFamily: "InterBold",
    fontSize: 17,
  },
  totalHeadingValue: {
    color: colors.primary,
    fontFamily: "InterBold",
    fontSize: 17,
  },
  actionFooter: {
    gap: spacing.xs,
  },
  primaryActionButton: {
    flex: 1,
  },
  utilityActionButton: {
    flex: 0.72,
  },
  disabledAction: {
    opacity: 0.6,
  },
});
