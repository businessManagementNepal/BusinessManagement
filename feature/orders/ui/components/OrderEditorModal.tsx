import {
  OrderFormState,
  OrderLineFormState,
} from "@/feature/orders/viewModel/orders.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import {
  Dropdown,
  DropdownOption,
} from "@/shared/components/reusable/DropDown/Dropdown";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { Plus, Trash2 } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  mode: "create" | "edit";
  canManage: boolean;
  form: OrderFormState;
  customerOptions: DropdownOption[];
  productOptions: DropdownOption[];
  statusOptions: DropdownOption[];
  onClose: () => void;
  onChange: (field: keyof Omit<OrderFormState, "items">, value: string) => void;
  onLineItemChange: (remoteId: string, field: keyof OrderLineFormState, value: string) => void;
  onAddLineItem: () => void;
  onRemoveLineItem: (remoteId: string) => void;
  onSubmit: () => Promise<void>;
};

export function OrderEditorModal({
  visible,
  mode,
  canManage,
  form,
  customerOptions,
  productOptions,
  statusOptions,
  onClose,
  onChange,
  onLineItemChange,
  onAddLineItem,
  onRemoveLineItem,
  onSubmit,
}: Props) {
  const title = mode === "create" ? "Create Order" : "Update Order";
  const lineItems = Array.isArray(form.items) ? form.items : [];

  return (
    <FormSheetModal
      visible={visible}
      title={title}
      subtitle="Manage business orders with products, customer, and status"
      onClose={onClose}
      contentContainerStyle={styles.content}
      footer={
        <FormModalActionFooter>
          <AppButton
            label="Cancel"
            variant="secondary"
            size="lg"
            style={styles.actionButton}
            onPress={onClose}
          />
          <AppButton
            label={mode === "create" ? "Create Order" : "Save Changes"}
            size="lg"
            style={styles.actionButton}
            onPress={() => void onSubmit()}
            disabled={!canManage}
          />
        </FormModalActionFooter>
      }
    >
      <LabeledTextInput
        label="Order Number"
        value={form.orderNumber}
        editable={false}
        helperText="Order number follows the current billing-style sequence in this codebase."
      />

      <LabeledTextInput
        label="Order Date"
        value={form.orderDate}
        onChangeText={(value) => onChange("orderDate", value)}
        placeholder="YYYY-MM-DD"
      />

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Customer</Text>
        <Dropdown
          value={form.customerRemoteId}
          options={customerOptions}
          onChange={(value) => onChange("customerRemoteId", value)}
          placeholder="Select customer"
          modalTitle="Select customer"
          showLeadingIcon={false}
        />
      </View>

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Status</Text>
        <Dropdown
          value={form.status}
          options={statusOptions}
          onChange={(value) => onChange("status", value)}
          placeholder="Select status"
          modalTitle="Select status"
          showLeadingIcon={false}
        />
      </View>

      <LabeledTextInput
        label="Delivery / Pickup Details"
        value={form.deliveryOrPickupDetails}
        onChangeText={(value) => onChange("deliveryOrPickupDetails", value)}
        placeholder="Delivery note, pickup detail, or short logistics note"
        multiline
      />

      <View style={styles.itemsHeaderRow}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        <Pressable style={styles.addItemChip} onPress={onAddLineItem} disabled={!canManage}>
          <Plus size={14} color={colors.primary} />
          <Text style={styles.addItemText}>Add Item</Text>
        </Pressable>
      </View>

      {lineItems.map((item, index) => (
        <View key={item.remoteId} style={styles.lineCard}>
          <Text style={styles.lineLabel}>Item {index + 1}</Text>
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Product / Service</Text>
            <Dropdown
              value={item.productRemoteId}
              options={productOptions}
              onChange={(value) => onLineItemChange(item.remoteId, "productRemoteId", value)}
              placeholder="Select product"
              modalTitle="Select product"
              showLeadingIcon={false}
            />
          </View>
          <LabeledTextInput
            label="Quantity"
            value={item.quantity}
            onChangeText={(value) => onLineItemChange(item.remoteId, "quantity", value)}
            keyboardType="decimal-pad"
            placeholder="1"
          />
          {lineItems.length > 1 ? (
            <Pressable
              style={styles.removeItemButton}
              onPress={() => onRemoveLineItem(item.remoteId)}
            >
              <Trash2 size={14} color={colors.destructive} />
              <Text style={styles.removeItemText}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      ))}

      <LabeledTextInput
        label="Tags"
        value={form.tags}
        onChangeText={(value) => onChange("tags", value)}
        placeholder="Simple text tags"
      />

      <LabeledTextInput
        label="Internal Remarks"
        value={form.internalRemarks}
        onChangeText={(value) => onChange("internalRemarks", value)}
        placeholder="Internal order remarks"
        multiline
      />

      <LabeledTextInput
        label="Notes"
        value={form.notes}
        onChangeText={(value) => onChange("notes", value)}
        placeholder="Customer note or extra order note"
        multiline
      />

    </FormSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontFamily: "InterBold",
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },
  itemsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.cardForeground,
    fontSize: 15,
    fontFamily: "InterBold",
  },
  addItemChip: {
    minHeight: 32,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addItemText: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: "InterBold",
  },
  lineCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.secondary,
  },
  lineLabel: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  removeItemButton: {
    alignSelf: "flex-start",
    minHeight: 30,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  removeItemText: {
    color: colors.destructive,
    fontSize: 12,
    fontFamily: "InterBold",
  },
  actionButton: {
    flex: 1,
  },
});
