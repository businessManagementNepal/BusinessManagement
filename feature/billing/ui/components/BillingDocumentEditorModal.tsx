import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CalendarDays, Plus, Printer, Trash2, X, FileDown } from "lucide-react-native";
import { Dropdown } from "@/shared/components/reusable/DropDown/Dropdown";
import { AppTextInput } from "@/shared/components/reusable/Form/AppTextInput";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { BillingDocumentFormState, BillingLineItemFormState } from "@/feature/billing/viewModel/billing.viewModel";
import { BILLING_STATUS_OPTIONS, BILLING_TAX_RATE_OPTIONS, BILLING_TEMPLATE_OPTIONS } from "@/feature/billing/types/billing.types";
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
  draftTotals,
}: {
  visible: boolean;
  title: string;
  form: BillingDocumentFormState;
  canManage: boolean;
  onClose: () => void;
  onChange: (field: keyof Omit<BillingDocumentFormState, "items">, value: string) => void;
  onLineItemChange: (remoteId: string, field: keyof BillingLineItemFormState, value: string) => void;
  onAddLineItem: () => void;
  onRemoveLineItem: (remoteId: string) => void;
  onSubmit: () => Promise<void>;
  onPrintPreview: () => void;
  onExportPdf: () => void;
  currencyCode: string;
  countryCode: string | null;
  draftTotals: { subtotalAmount: number; taxAmount: number; totalAmount: number };
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={onClose} />
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={24} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.formWrap}>
            <Text style={styles.label}>Customer Name</Text>
            <AppTextInput value={form.customerName} onChangeText={(value) => onChange("customerName", value)} placeholder="Enter customer name" />

            <Text style={styles.label}>Template</Text>
            <Dropdown
              value={form.templateType}
              options={BILLING_TEMPLATE_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
              onChange={(value) => onChange("templateType", value)}
              showLeadingIcon={false}
              modalTitle="Select template"
            />

            <Text style={styles.label}>Status</Text>
            <Dropdown
              value={form.status}
              options={BILLING_STATUS_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
              onChange={(value) => onChange("status", value)}
              showLeadingIcon={false}
              modalTitle="Select status"
            />

            <Text style={styles.label}>Items</Text>
            {form.items.map((item, index) => (
              <View key={item.remoteId} style={styles.lineItemWrap}>
                <View style={styles.lineItemRow}>
                  <AppTextInput
                    value={item.itemName}
                    onChangeText={(value) => onLineItemChange(item.remoteId, "itemName", value)}
                    placeholder="Item"
                    containerStyle={styles.lineItemName}
                  />
                  <AppTextInput
                    value={item.quantity}
                    onChangeText={(value) => onLineItemChange(item.remoteId, "quantity", value)}
                    placeholder="1"
                    keyboardType="decimal-pad"
                    containerStyle={styles.lineItemQty}
                  />
                  <AppTextInput
                    value={item.unitRate}
                    onChangeText={(value) => onLineItemChange(item.remoteId, "unitRate", value)}
                    placeholder="Rate"
                    keyboardType="decimal-pad"
                    containerStyle={styles.lineItemRate}
                  />
                  {form.items.length > 1 ? (
                    <Pressable style={styles.removeItemButton} onPress={() => onRemoveLineItem(item.remoteId)}>
                      <Trash2 size={16} color={colors.destructive} />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ))}

            <Pressable style={styles.addItemRow} onPress={onAddLineItem}>
              <Plus size={16} color={colors.primary} />
              <Text style={styles.addItemText}>Add Item</Text>
            </Pressable>

            <Text style={styles.label}>Tax Rate (%)</Text>
            <Dropdown
              value={form.taxRatePercent}
              options={BILLING_TAX_RATE_OPTIONS.map((option) => ({ label: option, value: option }))}
              onChange={(value) => onChange("taxRatePercent", value)}
              showLeadingIcon={false}
              modalTitle="Select tax rate"
            />

            <Text style={styles.label}>Issue Date</Text>
            <AppTextInput
              value={form.issuedAt}
              onChangeText={(value) => onChange("issuedAt", value)}
              placeholder="YYYY-MM-DD"
              leftIcon={<CalendarDays size={16} color={colors.mutedForeground} />}
            />

            <Text style={styles.label}>Notes</Text>
            <AppTextInput
              value={form.notes}
              onChangeText={(value) => onChange("notes", value)}
              placeholder="Payment terms, thank you message..."
              multiline
              containerStyle={styles.notesInput}
              style={styles.notesTextInput}
            />

            <View style={styles.totalCard}>
              <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalValue}>{formatCurrencyAmount({ amount: draftTotals.subtotalAmount, currencyCode, countryCode })}</Text></View>
              <View style={styles.totalRow}><Text style={styles.totalLabel}>Tax ({form.taxRatePercent || "0"}%)</Text><Text style={styles.totalValue}>{formatCurrencyAmount({ amount: draftTotals.taxAmount, currencyCode, countryCode })}</Text></View>
              <View style={styles.totalDivider} />
              <View style={styles.totalRow}><Text style={styles.totalHeading}>Total</Text><Text style={styles.totalHeadingValue}>{formatCurrencyAmount({ amount: draftTotals.totalAmount, currencyCode, countryCode })}</Text></View>
            </View>

            <View style={styles.actionRow}>
              <AppButton label="Save" size="lg" style={styles.flexPrimary} onPress={() => void onSubmit()} disabled={!canManage} />
              <AppButton label="Print" size="lg" variant="secondary" style={styles.actionButton} leadingIcon={<Printer size={16} color={colors.primary} />} onPress={onPrintPreview} />
              <AppButton label="PDF" size="lg" variant="secondary" style={styles.actionButton} leadingIcon={<FileDown size={16} color={colors.primary} />} onPress={onExportPdf} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center", paddingHorizontal: spacing.lg },
  overlayDismiss: { ...StyleSheet.absoluteFillObject },
  modalCard: { backgroundColor: colors.card, borderRadius: radius.xl ?? 24, borderWidth: 1, borderColor: colors.border, paddingTop: spacing.lg, maxHeight: "86%", zIndex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.cardForeground, fontFamily: "InterBold", fontSize: 18 },
  formWrap: { gap: spacing.sm, padding: spacing.lg },
  label: { color: colors.cardForeground, fontFamily: "InterSemiBold", fontSize: 14 },
  lineItemWrap: { gap: spacing.xs },
  lineItemRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  lineItemName: { flex: 1 },
  lineItemQty: { width: 80 },
  lineItemRate: { width: 110 },
  removeItemButton: { width: 34, height: 34, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.secondary },
  addItemRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingVertical: 4 },
  addItemText: { color: colors.primary, fontFamily: "InterBold", fontSize: 14 },
  notesInput: { minHeight: 96, alignItems: "flex-start" },
  notesTextInput: { minHeight: 80, textAlignVertical: "top" },
  totalCard: { backgroundColor: colors.secondary, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.xs },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { color: colors.mutedForeground, fontSize: 13 },
  totalValue: { color: colors.cardForeground, fontFamily: "InterSemiBold", fontSize: 13 },
  totalDivider: { height: 1, backgroundColor: colors.border, marginVertical: 2 },
  totalHeading: { color: colors.cardForeground, fontFamily: "InterBold", fontSize: 17 },
  totalHeadingValue: { color: colors.primary, fontFamily: "InterBold", fontSize: 17 },
  actionRow: { flexDirection: "row", gap: spacing.sm },
  flexPrimary: { flex: 1 },
  actionButton: { width: 108 },
});
