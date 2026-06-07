import {
  BillingDocumentFormState,
  BillingLineItemFormState,
  BillingSettlementAccountOption,
} from "@/feature/billing/viewModel/billing.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { AppTextInput } from "@/shared/components/reusable/Form/AppTextInput";
import { DualCalendarDatePicker } from "@/shared/components/reusable/Form/DualCalendarDatePicker";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledDropdownField } from "@/shared/components/reusable/Form/LabeledDropdownField";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import { formatCurrencyAmount } from "@/shared/utils/currency/accountCurrency";
import { Plus, Printer, Trash2 } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
  currencyCode,
  countryCode,
  taxLabel,
  taxRateOptions,
  availableSettlementAccounts,
  draftTotals,
}: {
  visible: boolean;
  title: string;
  form: BillingDocumentFormState;
  canManage: boolean;
  onClose: () => void;
  onChange: (
    field: keyof Omit<BillingDocumentFormState, "items" | "fieldErrors">,
    value: string,
  ) => void;
  onLineItemChange: (
    remoteId: string,
    field: keyof Omit<BillingLineItemFormState, "fieldErrors">,
    value: string,
  ) => void;
  onAddLineItem: () => void;
  onRemoveLineItem: (remoteId: string) => void;
  onSubmit: () => Promise<void>;
  onPrintPreview: () => void;
  currencyCode: string;
  countryCode: string | null;
  taxLabel: string;
  taxRateOptions: readonly string[];
  availableSettlementAccounts: readonly BillingSettlementAccountOption[];
  draftTotals: { subtotalAmount: number; taxAmount: number; totalAmount: number };
}) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const parseNumber = (value: string): number => {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const lineItems = Array.isArray(form.items) ? form.items : [];
  const paidNowAmount = Number(parseNumber(form.paidNowAmount).toFixed(2));
  const pendingAmount = Number(
    Math.max(draftTotals.totalAmount - paidNowAmount, 0).toFixed(2),
  );

  return (
    <FormSheetModal
      visible={visible}
      title={title}
      subtitle="Manage billing document details"
      onClose={onClose}
      closeAccessibilityLabel="Close billing editor"
      presentation="bottom-sheet"
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
            leadingIcon={<Printer size={16} color={theme.colors.primary} />}
            onPress={onPrintPreview}
          />
        </FormModalActionFooter>
      }
    >
      <LabeledTextInput
        label="Customer Name"
        value={form.customerName}
        onChangeText={(value) => onChange("customerName", value)}
        placeholder="Enter customer name"
        editable={canManage}
        errorText={form.fieldErrors.customerName}
      />

      <View style={styles.itemsHeaderWrap}>
        <Text style={styles.sectionLabel}>Items</Text>
        {form.fieldErrors.items ? (
          <Text style={styles.sectionErrorText}>{form.fieldErrors.items}</Text>
        ) : null}
      </View>

      <View style={styles.lineItemHeaderRow}>
        <Text style={[styles.lineItemHeaderText, styles.lineItemName]}>Item</Text>
        <Text style={[styles.lineItemHeaderText, styles.lineItemQty]}>Qty</Text>
        <Text style={[styles.lineItemHeaderText, styles.lineItemRate]}>Rate</Text>
        <View style={styles.lineItemActionSpacer} />
      </View>

      {lineItems.map((item) => {
        const hasInlineError =
          Boolean(item.fieldErrors.itemName) ||
          Boolean(item.fieldErrors.quantity) ||
          Boolean(item.fieldErrors.unitRate);

        return (
          <View key={item.remoteId} style={styles.lineItemWrap}>
            <View style={styles.lineItemRow}>
              <AppTextInput
                value={item.itemName}
                onChangeText={(value) =>
                  onLineItemChange(item.remoteId, "itemName", value)
                }
                placeholder="Item"
                containerStyle={styles.lineItemName}
                editable={canManage}
              />
              <AppTextInput
                value={item.quantity}
                onChangeText={(value) =>
                  onLineItemChange(item.remoteId, "quantity", value)
                }
                placeholder="1"
                keyboardType="decimal-pad"
                containerStyle={styles.lineItemQty}
                editable={canManage}
              />
              <AppTextInput
                value={item.unitRate}
                onChangeText={(value) =>
                  onLineItemChange(item.remoteId, "unitRate", value)
                }
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
                  <Trash2 size={16} color={theme.colors.destructive} />
                </Pressable>
              ) : null}
            </View>

            {hasInlineError ? (
              <View style={styles.lineItemErrorRow}>
                <View style={styles.lineItemName}>
                  {item.fieldErrors.itemName ? (
                    <Text style={styles.inlineErrorText}>
                      {item.fieldErrors.itemName}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.lineItemQty}>
                  {item.fieldErrors.quantity ? (
                    <Text style={[styles.inlineErrorText, styles.centeredInlineError]}>
                      {item.fieldErrors.quantity}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.lineItemRate}>
                  {item.fieldErrors.unitRate ? (
                    <Text style={[styles.inlineErrorText, styles.centeredInlineError]}>
                      {item.fieldErrors.unitRate}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.lineItemActionSpacer} />
              </View>
            ) : null}
          </View>
        );
      })}

      <Pressable
        style={[styles.addItemRow, !canManage ? styles.disabledAction : null]}
        onPress={onAddLineItem}
        disabled={!canManage}
      >
        <Plus size={16} color={theme.colors.primary} />
        <Text style={styles.addItemText}>Add Item</Text>
      </Pressable>

      <LabeledDropdownField
        label="Tax Rate (%)"
        value={form.taxRatePercent}
        options={taxRateOptions.map((option) => ({
          label: `${option}%`,
          value: option,
        }))}
        onChange={(value) => onChange("taxRatePercent", value)}
        modalTitle="Select tax rate"
        disabled={!canManage}
      />

      <DualCalendarDatePicker
        label="Issue Date"
        value={form.issuedAt}
        onChangeText={(value) => onChange("issuedAt", value)}
        placeholder="YYYY-MM-DD"
        editable={canManage}
        errorText={form.fieldErrors.issuedAt}
      />

      <LabeledTextInput
        label="Paid Now"
        value={form.paidNowAmount}
        onChangeText={(value) => onChange("paidNowAmount", value)}
        placeholder="0"
        keyboardType="decimal-pad"
        editable={canManage}
        errorText={form.fieldErrors.paidNowAmount}
      />

      {paidNowAmount > 0 ? (
        <LabeledDropdownField
          label="Money Account"
          value={form.settlementAccountRemoteId}
          options={availableSettlementAccounts.map((account) => ({
            label: account.label,
            value: account.remoteId,
          }))}
          onChange={(value) => onChange("settlementAccountRemoteId", value)}
          modalTitle="Select money account"
          placeholder="Select money account"
          disabled={!canManage}
          errorText={form.fieldErrors.settlementAccountRemoteId}
        />
      ) : null}

      <DualCalendarDatePicker
        label="Due Date"
        value={form.dueAt}
        onChangeText={(value) => onChange("dueAt", value)}
        placeholder="YYYY-MM-DD"
        editable={canManage}
        errorText={form.fieldErrors.dueAt}
      />

      <LabeledTextInput
        label="Notes"
        value={form.notes}
        onChangeText={(value) => onChange("notes", value)}
        placeholder="Payment terms, thank you message..."
        multiline={true}
        numberOfLines={4}
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
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Paid</Text>
          <Text style={styles.totalValue}>
            {formatCurrencyAmount({
              amount: paidNowAmount,
              currencyCode,
              countryCode,
            })}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Pending</Text>
          <Text style={styles.totalValue}>
            {formatCurrencyAmount({
              amount: pendingAmount,
              currencyCode,
              countryCode,
            })}
          </Text>
        </View>
      </View>
    </FormSheetModal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    formWrap: {
      gap: theme.scaleSpace(spacing.sm),
    },
    itemsHeaderWrap: {
      gap: 4,
    },
    sectionLabel: {
      color: theme.colors.cardForeground,
      fontFamily: "InterSemiBold",
      fontSize: theme.scaleText(14),
    },
    sectionErrorText: {
      color: theme.colors.destructive,
      fontFamily: "InterMedium",
      fontSize: theme.scaleText(12),
    },
    lineItemHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingBottom: theme.scaleSpace(spacing.xs),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      marginBottom: theme.scaleSpace(spacing.xs),
    },
    lineItemHeaderText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(11),
      fontFamily: "InterBold",
      textTransform: "uppercase",
      letterSpacing: 0.45,
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
    lineItemActionSpacer: {
      width: 34,
    },
    lineItemWrap: {
      gap: theme.scaleSpace(spacing.xs),
    },
    lineItemRow: {
      flexDirection: "row",
      gap: theme.scaleSpace(spacing.sm),
      alignItems: "center",
    },
    lineItemErrorRow: {
      flexDirection: "row",
      gap: theme.scaleSpace(spacing.sm),
      alignItems: "flex-start",
    },
    inlineErrorText: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(11),
      lineHeight: theme.scaleLineHeight(14),
      fontFamily: "InterMedium",
    },
    centeredInlineError: {
      textAlign: "center",
    },
    removeItemButton: {
      width: 34,
      height: 34,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.secondary,
    },
    addItemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.xs),
      paddingVertical: 4,
    },
    addItemText: {
      color: theme.colors.primary,
      fontFamily: "InterBold",
      fontSize: theme.scaleText(14),
    },
    totalCard: {
      backgroundColor: theme.colors.secondary,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.scaleSpace(spacing.md),
      gap: theme.scaleSpace(spacing.xs),
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    totalLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
    },
    totalValue: {
      color: theme.colors.cardForeground,
      fontFamily: "InterSemiBold",
      fontSize: theme.scaleText(13),
    },
    totalDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 2,
    },
    totalHeading: {
      color: theme.colors.cardForeground,
      fontFamily: "InterBold",
      fontSize: theme.scaleText(17),
    },
    totalHeadingValue: {
      color: theme.colors.primary,
      fontFamily: "InterBold",
      fontSize: theme.scaleText(17),
    },
    actionFooter: {
      gap: theme.scaleSpace(spacing.xs),
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
