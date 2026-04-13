import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Dropdown } from "@/shared/components/reusable/DropDown/Dropdown";
import { SearchInputRow } from "@/shared/components/reusable/Form/SearchInputRow";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { Plus, User, X } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PosCustomer } from "../../types/pos.entity.types";

type PosCustomerSelectorProps = {
  selectedCustomer: PosCustomer | null;
  customerSearchTerm: string;
  customerOptions: readonly DropdownOption[];
  onCustomerSearchChange: (value: string) => void;
  onSelectCustomer: (customer: PosCustomer) => void;
  onClearCustomer: () => void;
  onOpenCustomerCreateModal: () => void;
  disabled?: boolean;
};

export type DropdownOption = {
  label: string;
  value: string;
};

export function PosCustomerSelector({
  selectedCustomer,
  customerSearchTerm,
  customerOptions,
  onCustomerSearchChange,
  onSelectCustomer,
  onClearCustomer,
  onOpenCustomerCreateModal,
  disabled = false,
}: PosCustomerSelectorProps) {
  const selectedValue = selectedCustomer?.remoteId ?? "";

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Customer</Text>
      
      <View style={styles.inputRow}>
        <SearchInputRow
          value={customerSearchTerm}
          onChangeText={onCustomerSearchChange}
          placeholder="Search customers..."
          containerStyle={styles.searchInput}
        />
        
        <AppButton
          onPress={onOpenCustomerCreateModal}
          style={styles.addButton}
          disabled={disabled}
          label=""
          leadingIcon={<Plus size={16} color={colors.primary} />}
        />
      </View>

      {customerOptions.length > 0 && (
        <Dropdown
          value={selectedValue}
          options={customerOptions}
          onChange={(value) => {
            const customer = customerOptions.find(opt => opt.value === value);
            if (customer) {
              // Use full customer data from customerData field if available, otherwise fallback to label
              const customerData = (customer as any).customerData;
              onSelectCustomer({
                remoteId: customer.value,
                fullName: customerData?.fullName || customer.label,
                phone: customerData?.phone || null,
                address: customerData?.address || null,
              });
            }
          }}
          placeholder="Select customer"
          disabled={disabled}
          modalTitle="Select Customer"
          triggerStyle={styles.dropdownTrigger}
        />
      )}

      {selectedCustomer && (
        <View style={styles.selectedCustomer}>
          <View style={styles.customerInfo}>
            <User size={16} color={colors.mutedForeground} />
            <Text style={styles.customerName}>{selectedCustomer.fullName}</Text>
            {selectedCustomer.phone && (
              <Text style={styles.customerPhone}>{selectedCustomer.phone}</Text>
            )}
          </View>
          
          <Pressable
            style={styles.clearButton}
            onPress={onClearCustomer}
            disabled={disabled}
          >
            <X size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
  },
  inputRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownTrigger: {
    minHeight: 44,
  },
  selectedCustomer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
    flex: 1,
  },
  customerPhone: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  clearButton: {
    padding: spacing.xs,
  },
});
