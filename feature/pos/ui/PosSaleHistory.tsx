import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { SearchInputRow } from "@/shared/components/reusable/Form/SearchInputRow";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { formatCurrencyAmount } from "@/shared/utils/currency/accountCurrency";
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  FileText,
  RefreshCcw,
  ShieldAlert,
  X,
} from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type {
  PosSaleHistoryItem,
  PosSaleReconciliation,
} from "../types/posSaleHistory.entity.types";
import { PosArtifactReconciliationStatus } from "../types/posSaleHistory.entity.types";
import { PosReceiptDetail } from "./PosReceiptDetail";

type PosSaleHistoryProps = {
  visible: boolean;
  activeModal: "history" | "detail" | "none";
  receipts: readonly PosSaleHistoryItem[];
  isLoading: boolean;
  searchTerm: string;
  selectedReceipt: PosSaleHistoryItem | null;
  errorMessage: string | null;
  currencyCode: string;
  countryCode: string | null;
  reconciliation: PosSaleReconciliation | null;
  isReconciling: boolean;
  isResolving: boolean;
  recoveryMessage: string | null;
  onSearchChange: (value: string) => void;
  onReceiptPress: (receipt: PosSaleHistoryItem) => void;
  onPrintReceipt: (receipt: PosSaleHistoryItem) => Promise<void>;
  onShareReceipt: (receipt: PosSaleHistoryItem) => Promise<void>;
  onCloseHistory: () => void;
  onCloseDetail: () => void;
  onRefreshReconciliation: () => Promise<void>;
  onCleanupAbnormalSale: () => Promise<void>;
};

const PARTIALLY_POSTED = "partially_posted";
const FAILED = "failed";

const getStatusLabel = (status: string): string => {
  switch (status) {
    case PosArtifactReconciliationStatus.Present:
      return "PRESENT";
    case PosArtifactReconciliationStatus.Missing:
      return "MISSING";
    case PosArtifactReconciliationStatus.RecordedOnly:
      return "RECORDED";
    default:
      return "NOT RECORDED";
  }
};

export function PosSaleHistory({
  visible,
  activeModal,
  receipts,
  isLoading,
  searchTerm,
  selectedReceipt,
  errorMessage,
  currencyCode,
  countryCode,
  reconciliation,
  isReconciling,
  isResolving,
  recoveryMessage,
  onSearchChange,
  onReceiptPress,
  onPrintReceipt,
  onShareReceipt,
  onCloseHistory,
  onCloseDetail,
  onRefreshReconciliation,
  onCleanupAbnormalSale,
}: PosSaleHistoryProps) {
  const renderReceiptItem = ({ item }: { item: PosSaleHistoryItem }) => {
    const isPartiallyPosted = item.workflowStatus === PARTIALLY_POSTED;
    const isFailed = item.workflowStatus === FAILED;
    const hasSyncWarning = isPartiallyPosted || isFailed;
    const receipt = item.document;

    return (
      <Pressable
        style={styles.receiptItem}
        onPress={() => onReceiptPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`Receipt ${receipt.documentNumber}`}
      >
        <View style={styles.receiptHeader}>
          <View style={styles.receiptInfo}>
            <Text style={styles.receiptNumber}>{receipt.documentNumber}</Text>
            <Text style={styles.customerName}>
              {receipt.customerName || "Walk-in Customer"}
            </Text>
          </View>
          <Text style={styles.totalAmount}>
            {formatCurrencyAmount({
              amount: receipt.totalAmount,
              currencyCode,
              countryCode,
            })}
          </Text>
        </View>

        {hasSyncWarning ? (
          <View style={styles.syncWarningBanner}>
            <AlertTriangle size={12} color={colors.warning} />
            <Text style={styles.syncWarningText}>
              {item.lastErrorMessage
                ? item.lastErrorMessage
                : isFailed
                  ? "Posting failed - review Ledger and Billing manually."
                  : "Partial sync - some accounting entries may be missing."}
            </Text>
          </View>
        ) : null}

        <View style={styles.receiptFooter}>
          <View style={styles.dateContainer}>
            <Clock size={12} color={colors.mutedForeground} />
            <Text style={styles.dateText}>
              {new Date(receipt.issuedAt).toLocaleDateString()}
            </Text>
          </View>
          <View
            style={[
              styles.statusPill,
              hasSyncWarning
                ? styles.statusPillWarning
                : receipt.status === "paid"
                  ? styles.statusPillPaid
                  : styles.statusPillPending,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                hasSyncWarning
                  ? styles.statusTextWarning
                  : receipt.status === "paid"
                    ? styles.statusTextPaid
                    : styles.statusTextPending,
              ]}
            >
              {hasSyncWarning
                ? "SYNC ERROR"
                : receipt.status === "paid"
                  ? "PAID"
                  : receipt.status.replace("_", " ").toUpperCase()}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const isAbnormalSelectedReceipt =
    selectedReceipt?.workflowStatus === FAILED ||
    selectedReceipt?.workflowStatus === PARTIALLY_POSTED;

  const recoveryPanel =
    isAbnormalSelectedReceipt && selectedReceipt ? (
      <View style={styles.recoverySection}>
        <View style={styles.recoveryHeader}>
          <ShieldAlert size={16} color={colors.warning} />
          <Text style={styles.recoveryTitle}>Recovery & Reconciliation</Text>
        </View>

        <Text style={styles.recoverySubtitle}>
          Inspect linked accounting artifacts and clean up abnormal POS sales safely.
        </Text>

        {recoveryMessage ? (
          <View style={styles.recoveryInfoBanner}>
            <Text style={styles.recoveryInfoText}>{recoveryMessage}</Text>
          </View>
        ) : null}

        <View style={styles.recoveryRow}>
          <Text style={styles.recoveryLabel}>Billing document</Text>
          <Text style={styles.recoveryValue}>
            {reconciliation
              ? `${getStatusLabel(reconciliation.billingDocument.status)}${
                  reconciliation.billingDocument.remoteId
                    ? ` | ${reconciliation.billingDocument.remoteId}`
                    : ""
                }`
              : isReconciling
                ? "Checking..."
                : "Not checked"}
          </Text>
        </View>
        <Text style={styles.recoveryDetail}>
          {reconciliation?.billingDocument.detail ??
            "Load reconciliation to verify the Billing receipt reference."}
        </Text>

        <View style={styles.recoveryRow}>
          <Text style={styles.recoveryLabel}>Ledger due</Text>
          <Text style={styles.recoveryValue}>
            {reconciliation
              ? `${getStatusLabel(reconciliation.ledgerEntry.status)}${
                  reconciliation.ledgerEntry.remoteId
                    ? ` | ${reconciliation.ledgerEntry.remoteId}`
                    : ""
                }`
              : isReconciling
                ? "Checking..."
                : "Not checked"}
          </Text>
        </View>
        <Text style={styles.recoveryDetail}>
          {reconciliation?.ledgerEntry.detail ??
            "Load reconciliation to verify the linked Ledger due reference."}
        </Text>

        <View style={styles.recoveryRow}>
          <Text style={styles.recoveryLabel}>Transaction refs</Text>
          <Text style={styles.recoveryValue}>
            {reconciliation
              ? `${getStatusLabel(reconciliation.transactionRefs.status)} | ${reconciliation.transactionRefs.remoteIds.length}`
              : isReconciling
                ? "Checking..."
                : `${selectedReceipt.sale.postedTransactionRemoteIds.length} recorded`}
          </Text>
        </View>
        <Text style={styles.recoveryDetail}>
          {reconciliation?.transactionRefs.detail ??
            "For v1, transaction references are shown from the POS sale record and cleanup will attempt to void them by id."}
        </Text>

        <View style={styles.recoveryActionsRow}>
          <AppButton
            label={isReconciling ? "Checking..." : "Refresh Status"}
            variant="secondary"
            style={styles.recoveryActionButton}
            leadingIcon={<RefreshCcw size={16} color={colors.mutedForeground} />}
            onPress={() => {
              void onRefreshReconciliation();
            }}
            disabled={isReconciling || isResolving}
          />
          <AppButton
            label={isResolving ? "Cleaning..." : "Clean Up Artifacts"}
            variant="secondary"
            style={styles.recoveryActionButton}
            onPress={() => {
              void onCleanupAbnormalSale();
            }}
            disabled={isResolving || isReconciling || !reconciliation?.canRunCleanup}
          />
        </View>
      </View>
    ) : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={activeModal === "detail" ? onCloseDetail : onCloseHistory}
    >
      <KeyboardAvoidingView
        style={styles.keyboardSafeArea}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            {activeModal === "detail" && selectedReceipt ? (
              <>
                <View style={styles.headerRow}>
                  <Pressable
                    style={styles.backButton}
                    onPress={onCloseDetail}
                    accessibilityRole="button"
                    accessibilityLabel="Back to sale history"
                  >
                    <ArrowLeft size={20} color={colors.mutedForeground} />
                  </Pressable>
                  <Text style={styles.title}>Receipt Detail</Text>
                  <Pressable
                    style={styles.closeButton}
                    onPress={onCloseHistory}
                    accessibilityRole="button"
                    accessibilityLabel="Close sale history"
                  >
                    <X size={20} color={colors.mutedForeground} />
                  </Pressable>
                </View>

                <PosReceiptDetail
                  receipt={selectedReceipt.document}
                  currencyCode={currencyCode}
                  countryCode={countryCode}
                  onPrintReceipt={() => {
                    void onPrintReceipt(selectedReceipt);
                  }}
                  onShareReceipt={() => {
                    void onShareReceipt(selectedReceipt);
                  }}
                  onClose={onCloseDetail}
                  extraContent={recoveryPanel}
                />
              </>
            ) : (
              <>
                <View style={styles.headerRow}>
                  <Text style={styles.title}>Sale History</Text>
                  <Pressable
                    style={styles.closeButton}
                    onPress={onCloseHistory}
                    accessibilityRole="button"
                    accessibilityLabel="Close sale history"
                  >
                    <X size={20} color={colors.mutedForeground} />
                  </Pressable>
                </View>

                <SearchInputRow
                  value={searchTerm}
                  onChangeText={onSearchChange}
                  placeholder="Search by receipt or customer..."
                  containerStyle={styles.searchInput}
                />

                {errorMessage ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}

                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={colors.primary} />
                  </View>
                ) : (
                  <FlatList
                    data={receipts}
                    renderItem={renderReceiptItem}
                    keyExtractor={(item) => item.sale.remoteId}
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <FileText size={48} color={colors.mutedForeground} />
                        <Text style={styles.emptyTitle}>
                          {searchTerm.trim() ? "No receipts found" : "No sales yet"}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                          {searchTerm.trim()
                            ? "Try a different receipt number or customer name."
                            : "Completed sales will appear here."}
                        </Text>
                      </View>
                    }
                  />
                )}
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardSafeArea: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  modalCard: {
    width: "100%",
    maxWidth: 720,
    maxHeight: "82%",
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: colors.cardForeground,
    fontSize: 18,
    fontFamily: "InterBold",
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.xs,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    marginBottom: spacing.xs,
  },
  loadingContainer: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  errorBanner: {
    backgroundColor: "#FDF1F1",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#F2C7C7",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 13,
    fontFamily: "InterMedium",
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
    fontFamily: "InterBold",
    color: colors.cardForeground,
    marginBottom: 2,
  },
  customerName: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontFamily: "InterMedium",
  },
  totalAmount: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: colors.primary,
  },
  syncWarningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "#FEF9EC",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  syncWarningText: {
    flex: 1,
    fontSize: 11,
    color: colors.warning,
    fontFamily: "InterMedium",
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
    fontFamily: "InterMedium",
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  statusPillPaid: {
    backgroundColor: "#EAF6EE",
  },
  statusPillPending: {
    backgroundColor: colors.accent,
  },
  statusPillWarning: {
    backgroundColor: "#FEF9EC",
    borderWidth: 1,
    borderColor: colors.warning,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "InterBold",
  },
  statusTextPaid: {
    color: colors.success,
  },
  statusTextPending: {
    color: colors.mutedForeground,
  },
  statusTextWarning: {
    color: colors.warning,
  },
  emptyContainer: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "InterSemiBold",
    color: colors.cardForeground,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    fontFamily: "InterMedium",
    textAlign: "center",
    maxWidth: 260,
  },
  recoverySection: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.secondary,
  },
  recoveryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  recoveryTitle: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  recoverySubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  recoveryInfoBanner: {
    backgroundColor: "#EAF6EE",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#B8D7C0",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  recoveryInfoText: {
    color: colors.success,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  recoveryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  recoveryLabel: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterSemiBold",
    flex: 1,
  },
  recoveryValue: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: "InterBold",
    textAlign: "right",
  },
  recoveryDetail: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontFamily: "InterMedium",
    lineHeight: 16,
  },
  recoveryActionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  recoveryActionButton: {
    flex: 1,
  },
});
