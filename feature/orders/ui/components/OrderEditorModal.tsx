import {
  OrderFormPricingPreview,
  OrderFormState,
  OrderLineFormState,
} from "@/feature/orders/types/order.state.types";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Dropdown, DropdownOption } from "@/shared/components/reusable/DropDown/Dropdown";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledDropdownField } from "@/shared/components/reusable/Form/LabeledDropdownField";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import { Plus, Trash2 } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  mode: "create" | "edit";
  canManage: boolean;
  form: OrderFormState;
  formPricingPreview: OrderFormPricingPreview;
  customerOptions: DropdownOption[];
  customerPhoneByRemoteId: Readonly<Record<string, string | null>>;
  productOptions: DropdownOption[];
  productPriceByRemoteId: Readonly<Record<string, number>>;
  paymentMethodOptions: readonly DropdownOption[];
  onClose: () => void;
  onChange: (
    field: keyof Omit<OrderFormState, "items" | "fieldErrors">,
    value: string,
  ) => void;
  onLineItemChange: (
    remoteId: string,
    field: keyof Omit<OrderLineFormState, "fieldErrors">,
    value: string,
  ) => void;
  onAddLineItem: () => void;
  onRemoveLineItem: (remoteId: string) => void;
  onSubmit: () => Promise<void>;
};

const formatCompactAmount = (amount: number): string => {
  if (!Number.isFinite(amount)) {
    return "0";
  }

  if (Math.round(amount) === amount) {
    return String(amount);
  }

  return amount.toFixed(2);
};

export function OrderEditorModal({
  visible,
  mode,
  canManage,
  form,
  formPricingPreview,
  customerOptions,
  customerPhoneByRemoteId,
  productOptions,
  productPriceByRemoteId,
  paymentMethodOptions,
  onClose,
  onChange,
  onLineItemChange,
  onAddLineItem,
  onRemoveLineItem,
  onSubmit,
}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const title =
    mode === "create" ? "Create Order" : `Edit ${form.orderNumber || "Order"}`;
  const lineItems = Array.isArray(form.items) ? form.items : [];
  const selectedCustomerPhone = form.customerRemoteId
    ? customerPhoneByRemoteId[form.customerRemoteId] ?? ""
    : "";

  return (
    <FormSheetModal
      visible={visible}
      title={title}
      onClose={onClose}
      presentation="bottom-sheet"
      contentContainerStyle={styles.content}
      footer={
        <AppButton
          label={mode === "create" ? "Create Order" : "Update Order"}
          size="lg"
          style={styles.submitButton}
          onPress={() => void onSubmit()}
          disabled={!canManage}
        />
      }
    >
      <LabeledDropdownField
        label="Customer"
        value={form.customerRemoteId}
        options={customerOptions}
        onChange={(value) => onChange("customerRemoteId", value)}
        placeholder="Customer name"
        modalTitle="Select customer"
      />

      <LabeledTextInput
        label="Phone"
        value={selectedCustomerPhone}
        placeholder="Phone number"
        editable={false}
      />

      <View style={styles.itemsHeaderRow}>
        <Text style={styles.fieldLabel}>Items</Text>
        {form.fieldErrors.items ? (
          <Text style={styles.sectionErrorText}>{form.fieldErrors.items}</Text>
        ) : null}
      </View>

      <View style={styles.itemsTableHeader}>
        <Text style={[styles.tableHeaderText, styles.itemNameWrap]}>Item</Text>
        <Text style={[styles.tableHeaderText, styles.quantityWrap]}>Qty</Text>
        <Text style={[styles.tableHeaderText, styles.priceWrap]}>Price</Text>
        <View style={styles.itemActionSpacer} />
      </View>

      <View style={styles.itemsWrap}>
        {lineItems.map((item) => {
          const salePriceAmount = productPriceByRemoteId[item.productRemoteId] ?? 0;
          const hasInlineError =
            Boolean(item.fieldErrors.productRemoteId) ||
            Boolean(item.fieldErrors.quantity);

          return (
            <View key={item.remoteId} style={styles.itemBlock}>
              <View style={styles.itemRow}>
                <View style={styles.itemNameWrap}>
                  <Dropdown
                    value={item.productRemoteId}
                    options={productOptions}
                    onChange={(value) =>
                      onLineItemChange(item.remoteId, "productRemoteId", value)
                    }
                    placeholder="Item name"
                    modalTitle="Select item"
                    showLeadingIcon={false}
                  />
                </View>

                <LabeledTextInput
                  label=""
                  value={item.quantity}
                  onChangeText={(value) =>
                    onLineItemChange(item.remoteId, "quantity", value)
                  }
                  keyboardType="decimal-pad"
                  placeholder="1"
                  containerStyle={styles.quantityWrap}
                  inputStyle={styles.centeredInput}
                />

                <LabeledTextInput
                  label=""
                  value={formatCompactAmount(salePriceAmount)}
                  editable={false}
                  containerStyle={styles.priceWrap}
                  inputStyle={styles.centeredInput}
                />

                {lineItems.length > 1 ? (
                  <Pressable
                    style={styles.removeItemIconButton}
                    onPress={() => onRemoveLineItem(item.remoteId)}
                  >
                    <Trash2 size={14} color={theme.colors.destructive} />
                  </Pressable>
                ) : null}
              </View>

              {hasInlineError ? (
                <View style={styles.itemErrorRow}>
                  <View style={styles.itemNameWrap}>
                    {item.fieldErrors.productRemoteId ? (
                      <Text style={styles.inlineErrorText}>
                        {item.fieldErrors.productRemoteId}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.quantityWrap}>
                    {item.fieldErrors.quantity ? (
                      <Text style={[styles.inlineErrorText, styles.centeredErrorText]}>
                        {item.fieldErrors.quantity}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.priceWrap} />
                  <View style={styles.itemActionSpacer} />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      <Pressable style={styles.addItemButton} onPress={onAddLineItem} disabled={!canManage}>
        <Plus size={14} color={theme.colors.success} />
        <Text style={styles.addItemText}>Add Item</Text>
      </Pressable>

      <View style={styles.twoColumnGrid}>
        <LabeledTextInput label="Discount" value="0" editable={false} />
        <LabeledTextInput
          label="Paid Amount"
          value={formatCompactAmount(formPricingPreview.paidAmount)}
          editable={false}
        />
      </View>

      <LabeledDropdownField
        label="Payment Method"
        value={form.tags}
        options={paymentMethodOptions}
        onChange={(value) => onChange("tags", value)}
        placeholder="Select payment method"
        modalTitle="Select payment method"
      />

      <LabeledTextInput
        label="Notes"
        value={form.notes}
        onChangeText={(value) => onChange("notes", value)}
        placeholder="Order notes..."
        multiline
      />

      <View style={styles.totalCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formPricingPreview.subtotalLabel}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax ({formPricingPreview.taxRateLabel})</Text>
          <Text style={styles.totalValue}>{formPricingPreview.taxLabel}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Discount</Text>
          <Text style={styles.discountValue}>-{formPricingPreview.discountLabel}</Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalRow}>
          <Text style={styles.finalTotalLabel}>Total</Text>
          <Text style={styles.finalTotalValue}>{formPricingPreview.totalLabel}</Text>
        </View>
      </View>
    </FormSheetModal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    content: {
      gap: theme.scaleSpace(spacing.sm),
    },
    submitButton: {
      width: "100%",
    },
    fieldLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(11),
      fontFamily: "InterBold",
      textTransform: "uppercase",
      letterSpacing: 0.45,
    },
    tableHeaderText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(11),
      fontFamily: "InterBold",
      textTransform: "uppercase",
      letterSpacing: 0.45,
    },
    itemsTableHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingBottom: theme.scaleSpace(spacing.xs),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      marginBottom: theme.scaleSpace(spacing.xs),
    },
    itemsHeaderRow: {
      marginTop: theme.scaleSpace(spacing.xs),
      gap: theme.scaleSpace(4),
    },
    sectionErrorText: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(12),
      fontFamily: "InterMedium",
    },
    itemsWrap: {
      gap: theme.scaleSpace(spacing.sm),
    },
    itemBlock: {
      gap: theme.scaleSpace(4),
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: theme.scaleSpace(spacing.xs),
    },
    itemErrorRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.scaleSpace(spacing.xs),
    },
    itemNameWrap: {
      flex: 1,
    },
    quantityWrap: {
      width: theme.scaleSpace(58),
    },
    priceWrap: {
      width: theme.scaleSpace(66),
    },
    itemActionSpacer: {
      width: theme.scaleSpace(30),
    },
    centeredInput: {
      textAlign: "center",
      paddingHorizontal: theme.scaleSpace(spacing.xs),
    },
    centeredErrorText: {
      textAlign: "center",
    },
    inlineErrorText: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(11),
      lineHeight: theme.scaleLineHeight(14),
      fontFamily: "InterMedium",
    },
    removeItemIconButton: {
      width: theme.scaleSpace(30),
      height: theme.scaleSpace(30),
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.card,
      marginBottom: theme.scaleSpace(10),
    },
    addItemButton: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(6),
    },
    addItemText: {
      color: theme.colors.success,
      fontSize: theme.scaleText(14),
      fontFamily: "InterSemiBold",
    },
    twoColumnGrid: {
      flexDirection: "row",
      gap: theme.scaleSpace(spacing.sm),
    },
    totalCard: {
      borderWidth: 1,
      borderColor: theme.isDarkMode
        ? "rgba(99, 211, 148, 0.22)"
        : "rgba(31, 99, 64, 0.08)",
      backgroundColor: theme.isDarkMode
        ? "rgba(99, 211, 148, 0.12)"
        : "#EAF4EF",
      borderRadius: radius.lg,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.md),
      gap: theme.scaleSpace(4),
    },
    totalRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.scaleSpace(spacing.sm),
    },
    totalLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
      fontFamily: "InterMedium",
    },
    totalValue: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterMedium",
    },
    discountValue: {
      color: theme.colors.success,
      fontSize: theme.scaleText(14),
      fontFamily: "InterSemiBold",
    },
    totalDivider: {
      marginTop: theme.scaleSpace(2),
      marginBottom: theme.scaleSpace(2),
      height: 1,
      backgroundColor: theme.colors.border,
    },
    finalTotalLabel: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(15),
      fontFamily: "InterBold",
    },
    finalTotalValue: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(22),
      fontFamily: "InterBold",
    },
  });
