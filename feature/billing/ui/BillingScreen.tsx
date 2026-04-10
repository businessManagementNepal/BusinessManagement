import { BillingDocumentStatus } from "@/feature/billing/types/billing.types";
import {
  BillingTabValue,
  BillingViewModel,
} from "@/feature/billing/viewModel/billing.viewModel";
import { DashboardTabScaffold } from "@/feature/dashboard/shared/ui/DashboardTabScaffold";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Card, CardPressable } from "@/shared/components/reusable/Cards/Card";
import { StatCard } from "@/shared/components/reusable/Cards/StatCard";
import { Pill } from "@/shared/components/reusable/List/Pill";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import {
  Camera,
  FileDown,
  FileText,
  ImageIcon,
  Plus,
  Receipt,
  StickyNote,
} from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BillingDocumentEditorModal } from "./components/BillingDocumentEditorModal";
import { BillingTemplatesModal } from "./components/BillingTemplatesModal";
import { formatCurrencyAmount } from "@/shared/utils/currency/accountCurrency";

const formatDate = (value: number): string => {
  return new Date(value).toISOString().slice(0, 10);
};

const getTone = (status: string): "success" | "warning" | "danger" | "neutral" => {
  switch (status) {
    case BillingDocumentStatus.Paid:
      return "success";
    case BillingDocumentStatus.PartiallyPaid:
      return "warning";
    case BillingDocumentStatus.Pending:
      return "warning";
    case BillingDocumentStatus.Overdue:
      return "danger";
    default:
      return "neutral";
  }
};

const TABS: readonly { key: BillingTabValue; label: string }[] = [
  { key: "invoices", label: "Invoices" },
  { key: "receipts", label: "Receipts" },
  { key: "billPhotos", label: "Bill Photos" },
];

type BillingScreenProps = {
  viewModel: BillingViewModel;
};

export function BillingScreen({ viewModel }: BillingScreenProps) {
  return (
    <DashboardTabScaffold
      footer={null}
      baseBottomPadding={110}
      contentContainerStyle={null}
      showDivider={false}
    >
      <View style={styles.summaryRow}>
        <StatCard
          icon={<Text style={styles.summaryIcon}>#</Text>}
          value={String(viewModel.summary.totalDocuments)}
          label="Total"
        />
          <StatCard
            icon={<Text style={styles.summaryIcon}>!</Text>}
            value={formatCurrencyAmount({
              amount: viewModel.summary.pendingAmount,
              currencyCode: viewModel.currencyCode,
              countryCode: viewModel.countryCode,
            })}
            label="Pending"
            valueColor={colors.warning}
          />
          <StatCard
            icon={<Text style={styles.summaryIcon}>!</Text>}
            value={formatCurrencyAmount({
              amount: viewModel.summary.overdueAmount,
              currencyCode: viewModel.currencyCode,
              countryCode: viewModel.countryCode,
            })}
            label="Overdue"
            valueColor={colors.destructive}
          />
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const isActive = tab.key === viewModel.activeTab;
          return (
            <Pressable
              key={tab.key}
              style={[styles.tabButton, isActive ? styles.tabButtonActive : null]}
              onPress={() => viewModel.onTabChange(tab.key)}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  isActive ? styles.tabButtonTextActive : null,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {viewModel.activeTab === "billPhotos" ? (
        <>
          <AppButton
            label="Upload Bill Photo"
            size="lg"
            leadingIcon={<Camera size={18} color={colors.primaryForeground} />}
            onPress={() => void viewModel.onUploadBillPhoto()}
            disabled={!viewModel.canManage}
          />

          <Card style={styles.billPhotoCard}>
            {viewModel.billPhotos.length === 0 ? (
              <View style={styles.emptyStateWrap}>
                <ImageIcon size={36} color={colors.mutedForeground} />
                <Text style={styles.emptyStateTitle}>No bill photos yet</Text>
                <Text style={styles.emptyStateDescription}>
                  Upload photos of your bills and receipts for records
                </Text>
              </View>
            ) : (
              <View style={styles.photoGrid}>
                {viewModel.billPhotos.map((photo) => (
                  <View key={photo.remoteId} style={styles.photoItem}>
                    <Image
                      source={{ uri: photo.imageDataUrl }}
                      style={styles.photoImage}
                      resizeMode="cover"
                    />
                    <Text numberOfLines={1} style={styles.photoName}>
                      {photo.fileName}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </>
      ) : (
        <>
          <View style={styles.actionRow}>
            <AppButton
              label={viewModel.activeTab === "receipts" ? "New Receipt" : "New Invoice"}
              size="lg"
              style={styles.flexButton}
              leadingIcon={<Plus size={18} color={colors.primaryForeground} />}
              onPress={viewModel.onOpenCreate}
              disabled={!viewModel.canManage}
            />
            <AppButton
              label="Templates"
              variant="secondary"
              size="lg"
              style={styles.templateButton}
              leadingIcon={<StickyNote size={18} color={colors.primary} />}
              onPress={viewModel.onOpenTemplateModal}
            />
          </View>

          <Text style={styles.sectionTitle}>
            Recent {viewModel.activeTab === "receipts" ? "Receipts" : "Invoices"}
          </Text>

          {viewModel.isLoading ? <ActivityIndicator color={colors.primary} /> : null}
          {viewModel.errorMessage ? (
            <Text style={styles.errorText}>{viewModel.errorMessage}</Text>
          ) : null}

          <View style={styles.listWrap}>
            {viewModel.documents.length === 0 ? (
              <Card>
                <Text style={styles.emptyText}>No billing documents yet.</Text>
              </Card>
            ) : (
              viewModel.documents.map((document) => (
                <CardPressable
                  key={document.remoteId}
                  style={styles.listCard}
                  onPress={() => viewModel.onOpenEdit(document)}
                >
                  <View style={styles.iconWrap}>
                    {document.documentType === "receipt" ? (
                      <Receipt size={20} color={colors.primary} />
                    ) : (
                      <FileText size={20} color={colors.primary} />
                    )}
                  </View>

                  <View style={styles.listBody}>
                    <View style={styles.titleRow}>
                      <Text style={styles.documentTitle}>{document.documentNumber}</Text>
                      <Pill
                        label={document.status[0].toUpperCase() + document.status.slice(1)}
                        tone={getTone(document.status)}
                      />
                    </View>
                    <Text style={styles.documentSubtitle}>
                      {document.customerName} - {formatDate(document.issuedAt)}
                      {document.dueAt ? ` | Due ${formatDate(document.dueAt)}` : ""}
                      {document.isOverdue ? " | Overdue" : ""}
                    </Text>
                  </View>

                  <View style={styles.amountWrap}>
                    <Text style={styles.amountText}>
                      {formatCurrencyAmount({
                        amount:
                          document.outstandingAmount > 0
                            ? document.outstandingAmount
                            : document.totalAmount,
                        currencyCode: viewModel.currencyCode,
                        countryCode: viewModel.countryCode,
                      })}
                    </Text>
                    {viewModel.canManage ? (
                      <Pressable
                        onPress={() => {
                          Alert.alert(
                            `Delete ${document.documentType === "receipt" ? "receipt" : "invoice"}`,
                            `Delete ${document.documentNumber}?`,
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Delete",
                                style: "destructive",
                                onPress: () => {
                                  void viewModel.onDelete(document);
                                },
                              },
                            ],
                          );
                        }}
                      >
                        <Text style={styles.deleteText}>Delete</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </CardPressable>
              ))
            )}
          </View>
        </>
      )}

      <BillingTemplatesModal
        visible={viewModel.isTemplateModalVisible}
        activeTemplateType={viewModel.activeTemplateType}
        templateOptions={viewModel.templateOptions}
        onClose={viewModel.onCloseTemplateModal}
        onSelect={viewModel.onSelectTemplate}
      />

      <BillingDocumentEditorModal
        visible={viewModel.isEditorVisible}
        title={viewModel.editorTitle}
        form={viewModel.form}
        canManage={viewModel.canManage}
        onClose={viewModel.onCloseEditor}
        onChange={viewModel.onFormChange}
        onLineItemChange={viewModel.onLineItemChange}
        onAddLineItem={viewModel.onAddLineItem}
        onRemoveLineItem={viewModel.onRemoveLineItem}
        onSubmit={viewModel.onSubmit}
        onPrintPreview={viewModel.onPrintPreview}
        onExportPdf={viewModel.onExportPdf}
        currencyCode={viewModel.currencyCode}
        countryCode={viewModel.countryCode}
        taxLabel={viewModel.taxLabel}
        taxRateOptions={viewModel.taxRateOptions}
        availableSettlementAccounts={viewModel.availableSettlementAccounts}
        draftTotals={viewModel.draftTotals}
      />
    </DashboardTabScaffold>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: "row", gap: spacing.sm },
  summaryIcon: { color: colors.primary, fontFamily: "InterBold", fontSize: 18 },
  tabRow: { flexDirection: "row", gap: spacing.sm },
  tabButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabButtonText: { color: colors.cardForeground, fontFamily: "InterBold", fontSize: 14 },
  tabButtonTextActive: { color: colors.primaryForeground },
  actionRow: { flexDirection: "row", gap: spacing.sm },
  flexButton: { flex: 1 },
  templateButton: { width: 148 },
  sectionTitle: {
    color: colors.cardForeground,
    fontFamily: "InterBold",
    fontSize: 18,
    marginTop: spacing.xs,
  },
  errorText: { color: colors.destructive, fontFamily: "InterMedium", fontSize: 12 },
  listWrap: { gap: spacing.sm },
  listCard: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  listBody: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  documentTitle: { color: colors.cardForeground, fontFamily: "InterBold", fontSize: 16 },
  documentSubtitle: { color: colors.mutedForeground, fontSize: 12 },
  amountWrap: { alignItems: "flex-end", gap: 4 },
  amountText: { color: colors.cardForeground, fontFamily: "InterBold", fontSize: 15 },
  deleteText: { color: colors.destructive, fontFamily: "InterBold", fontSize: 12 },
  emptyText: { color: colors.mutedForeground, fontSize: 13 },
  billPhotoCard: { minHeight: 220 },
  emptyStateWrap: {
    flex: 1,
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  emptyStateTitle: { color: colors.cardForeground, fontFamily: "InterBold", fontSize: 22 },
  emptyStateDescription: {
    color: colors.mutedForeground,
    fontSize: 14,
    textAlign: "center",
    maxWidth: 260,
  },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  photoItem: { width: "48%", gap: 6 },
  photoImage: {
    width: "100%",
    aspectRatio: 1.2,
    borderRadius: radius.lg,
    backgroundColor: colors.secondary,
  },
  photoName: { color: colors.cardForeground, fontSize: 12, fontFamily: "InterMedium" },
});
