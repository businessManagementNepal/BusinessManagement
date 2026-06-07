import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { SearchInputRow } from "@/shared/components/reusable/Form/SearchInputRow";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import { Plus, User, X } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PosCustomer } from "../../types/pos.entity.types";
import type { PosCustomerOption } from "../../types/pos.ui.types";

type PosCustomerSelectorProps = {
  selectedCustomer: PosCustomer | null;
  customerSearchTerm: string;
  customerOptions: readonly PosCustomerOption[];
  onCustomerSearchChange: (value: string) => void;
  onSelectCustomer: (customer: PosCustomer) => void;
  onClearCustomer: () => void;
  onOpenCustomerCreateModal: () => void;
  disabled?: boolean;
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
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

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
          leadingIcon={<Plus size={16} color={theme.colors.primary} />}
        />
      </View>

      {customerSearchTerm.trim() !== "" && (
        <View style={styles.resultsContainer}>
          {customerOptions.length > 0 ? (
            customerOptions.slice(0, 10).map((option) => (
              <Pressable
                key={option.value}
                style={styles.resultRow}
                onPress={() => {
                  onSelectCustomer({
                    remoteId: option.customerData.remoteId,
                    fullName: option.customerData.fullName,
                    phone: option.customerData.phone,
                    address: option.customerData.address,
                  });
                }}
                disabled={disabled}
              >
                <Text style={styles.resultName}>{option.customerData?.fullName}</Text>
                {option.customerData?.phone && (
                  <Text style={styles.resultPhone}>{option.customerData.phone}</Text>
                )}
              </Pressable>
            ))
          ) : (
            <Text style={styles.noResultsText}>No customers found</Text>
          )}
        </View>
      )}

      {selectedCustomer && (
        <View style={styles.selectedCustomer}>
          <View style={styles.customerInfo}>
            <User size={16} color={theme.colors.mutedForeground} />
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
            <X size={16} color={theme.colors.mutedForeground} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      gap: theme.scaleSpace(spacing.sm),
    },
    label: {
      fontSize: theme.scaleText(14),
      fontWeight: "600",
      color: theme.colors.foreground,
    },
    inputRow: {
      flexDirection: "row",
      gap: theme.scaleSpace(spacing.sm),
      alignItems: "center",
    },
    searchInput: {
      flex: 1,
    },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: radius.lg,
      backgroundColor: theme.colors.accent,
      justifyContent: "center",
      alignItems: "center",
    },
    selectedCustomer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: theme.scaleSpace(spacing.sm),
      backgroundColor: theme.colors.accent,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    customerInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.sm),
      flex: 1,
    },
    customerName: {
      fontSize: theme.scaleText(14),
      fontWeight: "500",
      color: theme.colors.foreground,
      flex: 1,
    },
    customerPhone: {
      fontSize: theme.scaleText(12),
      color: theme.colors.mutedForeground,
    },
    clearButton: {
      padding: theme.scaleSpace(spacing.xs),
    },
    resultsContainer: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.lg,
      backgroundColor: theme.colors.card,
      maxHeight: 200,
    },
    resultRow: {
      padding: theme.scaleSpace(spacing.sm),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    resultName: {
      fontSize: theme.scaleText(14),
      fontWeight: "500",
      color: theme.colors.foreground,
    },
    resultPhone: {
      fontSize: theme.scaleText(12),
      color: theme.colors.mutedForeground,
      marginTop: 2,
    },
    noResultsText: {
      fontSize: theme.scaleText(12),
      color: theme.colors.mutedForeground,
      fontStyle: "italic",
      padding: theme.scaleSpace(spacing.sm),
      textAlign: "center",
    },
  });
