import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  Package,
} from "lucide-react-native";
import { DashboardTabScaffold } from "@/feature/dashboard/shared/ui/DashboardTabScaffold";
import { InventoryViewModel } from "@/feature/inventory/viewModel/inventory.viewModel";
import { InventoryMovementType } from "@/feature/inventory/types/inventory.types";
import { StatCard } from "@/shared/components/reusable/Cards/StatCard";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { BottomTabAwareFooter } from "@/shared/components/reusable/ScreenLayouts/BottomTabAwareFooter";
import { InlineSectionHeader } from "@/shared/components/reusable/ScreenLayouts/InlineSectionHeader";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { InventoryMovementModal } from "./components/InventoryMovementModal";

type InventoryScreenProps = {
  viewModel: InventoryViewModel;
};

const formatCurrency = (value: number): string => {
  if (value >= 1000 && value % 1000 === 0) {
    return `NPR ${Math.round(value / 1000)}K`;
  }

  return `NPR ${value.toLocaleString()}`;
};

const formatMovementDate = (timestamp: number): string => {
  const movementDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const formatDateKey = (value: Date): string => {
    return `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`;
  };

  const movementDateKey = formatDateKey(movementDate);
  if (movementDateKey === formatDateKey(today)) {
    return "Today";
  }

  if (movementDateKey === formatDateKey(yesterday)) {
    return "Yesterday";
  }

  return movementDate.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
};

const formatMovementTypeLabel = (movementType: string, reason: string | null): string => {
  if (movementType === InventoryMovementType.StockIn) {
    return "Purchase";
  }

  if (movementType === InventoryMovementType.SaleOut) {
    return "Sale";
  }

  if (reason === null || reason.length === 0) {
    return "Adjustment";
  }

  return reason.replace("_", " ");
};

export function InventoryScreen({ viewModel }: InventoryScreenProps) {
  const lowStockItems = viewModel.stockItems.filter((item) => item.isLowStock);

  return (
    <>
      <DashboardTabScaffold
        footer={
          <BottomTabAwareFooter>
            <View style={styles.footerActionRow}>
              <AppButton
                label="Stock In"
                variant="primary"
                size="lg"
                style={styles.footerActionButton}
                leadingIcon={<ArrowDownLeft size={18} color={colors.primaryForeground} />}
                onPress={viewModel.onOpenStockIn}
                disabled={!viewModel.canManage}
              />
              <AppButton
                label="Adjust"
                variant="secondary"
                size="lg"
                style={styles.footerActionButton}
                leadingIcon={<ArrowUpRight size={18} color={colors.primary} />}
                onPress={viewModel.onOpenAdjustment}
                disabled={!viewModel.canManage}
              />
            </View>
          </BottomTabAwareFooter>
        }
        baseBottomPadding={170}
        contentContainerStyle={styles.content}
        showDivider={false}
      >
        <View style={styles.summaryRow}>
          <StatCard
            icon={<Package size={18} color={colors.primary} />}
            value={String(viewModel.summary.totalProducts)}
            label="Products"
          />
          <StatCard
            icon={<AlertTriangle size={18} color={colors.warning} />}
            value={String(viewModel.summary.lowStockCount)}
            label="Low Stock"
            valueColor={colors.warning}
          />
          <StatCard
            icon={<Text style={styles.currencyIcon}>Rs</Text>}
            value={formatCurrency(viewModel.summary.stockValue)}
            label="Stock Value"
          />
        </View>

        {lowStockItems.length > 0 ? (
          <View style={styles.bannerCard}>
            <View style={styles.bannerIconWrap}>
              <AlertTriangle size={18} color={colors.warning} />
            </View>
            <View style={styles.bannerBody}>
              <Text style={styles.bannerTitle}>{`${lowStockItems.length} items low on stock`}</Text>
              <Text style={styles.bannerSubtitle}>Restock soon to avoid disruptions</Text>
            </View>
          </View>
        ) : null}

        {viewModel.isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : viewModel.errorMessage ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{viewModel.errorMessage}</Text>
          </View>
        ) : (
          <>
            <InlineSectionHeader title="Stock on Hand" />

            {viewModel.stockItems.length === 0 ? (
              <View style={styles.centerState}>
                <Text style={styles.emptyText}>No item products available for inventory yet.</Text>
              </View>
            ) : (
              <View style={styles.tableContainer}>
                {viewModel.stockItems.map((item, index) => (
                  <View
                    key={item.productRemoteId}
                    style={[
                      styles.stockRow,
                      index < viewModel.stockItems.length - 1 ? styles.stockRowDivider : null,
                    ]}
                  >
                    <View style={styles.itemIconWrap}>
                      <Boxes size={18} color={colors.primary} />
                    </View>

                    <View style={styles.stockBody}>
                      <Text style={styles.itemTitle}>{item.name}</Text>
                      <Text style={styles.itemSubtitle}>
                        {item.stockQuantity} {item.unitLabel === null ? "unit" : item.unitLabel} in stock
                      </Text>
                    </View>

                    <View style={styles.stockValueWrap}>
                      <Text style={styles.valueText}>{formatCurrency(item.stockValue)}</Text>
                      {item.isLowStock ? (
                        <View style={styles.lowStockBadge}>
                          <Text style={styles.lowStockBadgeText}>Low Stock</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
            <InlineSectionHeader title="Recent Movements" />

            {viewModel.recentMovements.length === 0 ? (
              <View style={styles.centerState}>
                <Text style={styles.emptyText}>No inventory movement yet.</Text>
              </View>
            ) : (
              <View style={styles.tableContainer}>
                {viewModel.recentMovements.map((movement, index) => {
                  const isPositiveMovement = movement.deltaQuantity > 0;
                  return (
                    <View
                      key={movement.remoteId}
                      style={[
                        styles.movementRow,
                        index < viewModel.recentMovements.length - 1
                          ? styles.movementRowDivider
                          : null,
                      ]}
                    >
                      <View
                        style={[
                          styles.itemIconWrap,
                          isPositiveMovement ? styles.positiveIcon : styles.negativeIcon,
                        ]}
                      >
                        {isPositiveMovement ? (
                          <ArrowDownLeft size={18} color={colors.success} />
                        ) : (
                          <ArrowUpRight size={18} color={colors.destructive} />
                        )}
                      </View>

                      <View style={styles.stockBody}>
                        <Text style={styles.itemTitle}>{movement.productName}</Text>
                        <Text style={styles.itemSubtitle}>
                          {formatMovementDate(movement.movementAt)} | {" "}
                          {formatMovementTypeLabel(movement.type, movement.reason)}
                        </Text>
                      </View>

                      <View style={styles.stockValueWrap}>
                        <Text
                          style={[
                            styles.deltaText,
                            isPositiveMovement ? styles.deltaPositive : styles.deltaNegative,
                          ]}
                        >
                          {isPositiveMovement ? "+" : "-"}
                          {Math.abs(movement.deltaQuantity)} {movement.productUnitLabel ?? "unit"}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </DashboardTabScaffold>

      <InventoryMovementModal
        visible={viewModel.isEditorVisible}
        editorType={viewModel.editorType}
        title={viewModel.editorTitle}
        form={viewModel.form}
        productOptions={viewModel.productOptions}
        adjustmentReasonOptions={viewModel.adjustmentReasonOptions}
        onClose={viewModel.onCloseEditor}
        onChange={viewModel.onFormChange}
        onSubmit={viewModel.onSubmit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  currencyIcon: {
    color: colors.primary,
    fontFamily: "InterBold",
    fontSize: 18,
  },
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#F7F0E1",
    borderColor: "#E8D6A7",
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  bannerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF6DA",
  },
  bannerBody: {
    flex: 1,
  },
  bannerTitle: {
    color: colors.cardForeground,
    fontFamily: "InterBold",
    fontSize: 15,
    marginBottom: 2,
  },
  bannerSubtitle: {
    color: colors.mutedForeground,
    fontSize: 13,
  },
  tableContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
  },
  stockRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  positiveIcon: {
    backgroundColor: "#E7F6EC",
  },
  negativeIcon: {
    backgroundColor: "#FBE9E9",
  },
  stockBody: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    color: colors.cardForeground,
    fontFamily: "InterBold",
    fontSize: 14,
  },
  itemSubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
  stockValueWrap: {
    alignItems: "flex-end",
    gap: 4,
    maxWidth: 140,
  },
  valueText: {
    color: colors.cardForeground,
    fontFamily: "InterBold",
    fontSize: 13,
  },
  lowStockBadge: {
    borderRadius: radius.pill,
    backgroundColor: "#FBEDEB",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  lowStockBadgeText: {
    color: colors.destructive,
    fontSize: 10,
    fontFamily: "InterMedium",
  },
  movementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
  },
  movementRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  deltaText: {
    fontFamily: "InterBold",
    fontSize: 13,
  },
  deltaPositive: {
    color: colors.success,
  },
  deltaNegative: {
    color: colors.destructive,
  },
  footerActionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  footerActionButton: {
    flex: 1,
  },
  centerState: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 13,
    textAlign: "center",
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
});

