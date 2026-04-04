import { DashboardTabScaffold } from "@/feature/dashboard/shared/ui/DashboardTabScaffold";
import {
  Product,
  ProductKind,
  ProductKindValue,
} from "@/feature/products/types/product.types";
import { ProductsViewModel } from "@/feature/products/viewModel/products.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { StatCard } from "@/shared/components/reusable/Cards/StatCard";
import { FilterChipGroup } from "@/shared/components/reusable/Form/FilterChipGroup";
import { SearchInputRow } from "@/shared/components/reusable/Form/SearchInputRow";
import { BottomTabAwareFooter } from "@/shared/components/reusable/ScreenLayouts/BottomTabAwareFooter";
import { InlineSectionHeader } from "@/shared/components/reusable/ScreenLayouts/InlineSectionHeader";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { Box, Plus } from "lucide-react-native";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ProductEditorModal } from "./components/ProductEditorModal";
import { formatCurrencyAmount } from "@/shared/utils/currency/accountCurrency";

type ProductsScreenProps = {
  viewModel: ProductsViewModel;
};

const PRODUCT_KIND_FILTER_OPTIONS: readonly {
  label: string;
  value: "all" | ProductKindValue;
}[] = [
  { label: "All", value: "all" },
  { label: "Items", value: ProductKind.Item },
  { label: "Services", value: ProductKind.Service },
];

const buildProductSubtitle = (product: Product): string => {
  const productTypeLabel = product.kind === ProductKind.Item ? "Item" : "Service";

  if (product.kind === ProductKind.Service) {
    return productTypeLabel;
  }

  if (product.stockQuantity === null) {
    return productTypeLabel;
  }

  const unitLabel = product.unitLabel === null ? "unit" : product.unitLabel;
  return `${productTypeLabel} | Stock: ${product.stockQuantity} ${unitLabel}`;
};

export function ProductsScreen({ viewModel }: ProductsScreenProps) {
  const handleClearFilters = useCallback((): void => {
    viewModel.onSearchChange("");
    viewModel.onKindFilterChange("all");
  }, [viewModel]);

  const handleDeleteProduct = useCallback(
    (product: Product): void => {
      if (!viewModel.canManage) {
        return;
      }

      Alert.alert("Delete product", `Delete ${product.name}?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void viewModel.onDelete(product);
          },
        },
      ]);
    },
    [viewModel],
  );

  const handleDeletePress = useCallback(
    (event: GestureResponderEvent, product: Product): void => {
      event.stopPropagation();
      handleDeleteProduct(product);
    },
    [handleDeleteProduct],
  );

  return (
    <>
      <DashboardTabScaffold
        footer={
          <BottomTabAwareFooter>
            <AppButton
              label="Add Product"
              size="lg"
              style={styles.primaryActionButton}
              leadingIcon={<Plus size={18} color={colors.primaryForeground} />}
              onPress={viewModel.onOpenCreate}
              disabled={!viewModel.canManage}
            />
          </BottomTabAwareFooter>
        }
        baseBottomPadding={140}
        contentContainerStyle={styles.content}
        showDivider={false}
      >
        <View style={styles.summaryRow}>
          <StatCard
            icon={<Text style={styles.statIcon}>#</Text>}
            value={String(viewModel.summary.totalItems)}
            label="Items"
          />
          <StatCard
            icon={<Text style={styles.statIcon}>#</Text>}
            value={String(viewModel.summary.totalServices)}
            label="Services"
          />
          <StatCard
            icon={<Text style={styles.statIcon}>!</Text>}
            value={String(viewModel.summary.lowStockCount)}
            label="Low Stock"
            valueColor={colors.warning}
          />
        </View>

        <SearchInputRow
          value={viewModel.searchQuery}
          onChangeText={viewModel.onSearchChange}
          placeholder="Search products"
          inputStyle={styles.searchInput}
        />

        <FilterChipGroup
          options={PRODUCT_KIND_FILTER_OPTIONS}
          selectedValue={viewModel.selectedKind}
          onSelect={viewModel.onKindFilterChange}
        />

        <InlineSectionHeader
          title="Products"
          actionLabel="Clear Filters"
          onActionPress={handleClearFilters}
        />

        {viewModel.isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : viewModel.errorMessage ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{viewModel.errorMessage}</Text>
          </View>
        ) : viewModel.products.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyText}>No products found for selected filters.</Text>
          </View>
        ) : (
          <View style={styles.tableContainer}>
            {viewModel.products.map((product, index) => (
              <Pressable
                key={product.remoteId}
                style={[
                  styles.productRow,
                  index < viewModel.products.length - 1 ? styles.productRowDivider : null,
                ]}
                onPress={() => {
                  if (viewModel.canManage) {
                    viewModel.onOpenEdit(product);
                  }
                }}
                disabled={!viewModel.canManage}
              >
                <View style={styles.productIconWrap}>
                  <Box size={18} color={colors.primary} />
                </View>

                <View style={styles.productBody}>
                  <Text style={styles.productTitle}>{product.name}</Text>
                  <Text style={styles.productSubtitle}>{buildProductSubtitle(product)}</Text>
                </View>

                <View style={styles.priceWrap}>
                  <Text style={styles.salePrice}>
                    {formatCurrencyAmount({
                      amount: product.salePrice,
                      currencyCode: viewModel.currencyCode,
                      countryCode: viewModel.countryCode,
                    })}
                  </Text>
                  {product.costPrice !== null ? (
                    <Text style={styles.costPrice}>
                      Cost:{" "}
                      {formatCurrencyAmount({
                        amount: product.costPrice,
                        currencyCode: viewModel.currencyCode,
                        countryCode: viewModel.countryCode,
                      })}
                    </Text>
                  ) : null}
                  {viewModel.canManage ? (
                    <Pressable
                      onPress={(event) => handleDeletePress(event, product)}
                      hitSlop={8}
                    >
                      <Text style={styles.deleteText}>Delete</Text>
                    </Pressable>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </DashboardTabScaffold>

      <ProductEditorModal
        visible={viewModel.isEditorVisible}
        mode={viewModel.editorMode}
        form={viewModel.form}
        categoryOptions={viewModel.categoryOptions}
        unitOptions={viewModel.unitOptions}
        taxRateOptions={viewModel.taxRateOptions}
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
  primaryActionButton: {
    width: "100%",
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statIcon: {
    color: colors.primary,
    fontFamily: "InterBold",
    fontSize: 18,
  },
  searchInput: {
    color: colors.cardForeground,
  },
  tableContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
  },
  productRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  productBody: {
    flex: 1,
    gap: 2,
  },
  productTitle: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  productSubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
  priceWrap: {
    alignItems: "flex-end",
    gap: 2,
    maxWidth: 150,
  },
  salePrice: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  costPrice: {
    color: colors.mutedForeground,
    fontSize: 11,
  },
  deleteText: {
    color: colors.destructive,
    fontSize: 11,
    fontFamily: "InterBold",
    marginTop: 2,
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
