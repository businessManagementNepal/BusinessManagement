import { BillingDocument } from "@/feature/billing/types/billing.types";
import { SearchInputRow } from "@/shared/components/reusable/Form/SearchInputRow";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { formatCurrencyAmount } from "@/shared/utils/currency/accountCurrency";
import { Clock, FileText, X } from "lucide-react-native";
import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

type PosSaleHistoryProps = {
  receipts: BillingDocument[];
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  searchTerm: string;
  onReceiptPress: (receipt: BillingDocument) => void;
  onPrintReceipt: (receipt: BillingDocument) => void;
  onShareReceipt: (receipt: BillingDocument) => void;
  onClose: () => void;
  currencyCode: string;
  countryCode: string | null;
};

export function PosSaleHistory({
  receipts,
  isLoading,
  onSearchChange,
  searchTerm,
  onReceiptPress,
  onPrintReceipt,
  onShareReceipt,
  onClose,
  currencyCode,
  countryCode,
}: PosSaleHistoryProps) {
  const renderReceiptItem = ({ item }: { item: BillingDocument }) => (
    <Pressable
      style={styles.receiptItem}
      onPress={() => onReceiptPress(item)}
    >
      <View style={styles.receiptHeader}>
        <View style={styles.receiptInfo}>
          <Text style={styles.receiptNumber}>{item.documentNumber}</Text>
          <Text style={styles.customerName}>
            {item.customerName || "Anonymous"}
          </Text>
        </View>
        <Text style={styles.totalAmount}>
          {formatCurrencyAmount({
            amount: item.totalAmount,
            currencyCode,
            countryCode,
          })}
        </Text>
      </View>
      
      <View style={styles.receiptFooter}>
        <View style={styles.dateContainer}>
          <Clock size={12} color={colors.mutedForeground} />
          <Text style={styles.dateText}>
            {new Date(item.issuedAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <Text style={[
            styles.statusText,
            { color: item.status === "paid" ? colors.success : colors.warning }
          ]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.overlay}>
      <View style={styles.modalCard}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Sale History</Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <X size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <SearchInputRow
          value={searchTerm}
          onChangeText={onSearchChange}
          placeholder="Search receipts..."
          containerStyle={styles.searchInput}
        />

        <FlatList
          data={receipts}
          renderItem={renderReceiptItem}
          keyExtractor={(item) => item.remoteId}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FileText size={48} color={colors.mutedForeground} />
              <Text style={styles.emptyText}>
                {searchTerm.trim() ? "No receipts found" : "No receipts yet"}
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    maxHeight: "80%",
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.cardForeground,
    fontSize: 18,
    fontFamily: "InterBold",
  },
  searchInput: {
    marginBottom: spacing.sm,
  },
  list: {
    flex: 1,
  },
  receiptItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.secondary,
  },
  receiptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  receiptInfo: {
    flex: 1,
  },
  receiptNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.cardForeground,
    marginBottom: 2,
  },
  customerName: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  receiptFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dateText: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  statusContainer: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: spacing.sm,
  },
});
