import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Tags } from "lucide-react-native";
import { CategoryKind, CATEGORY_FILTER_OPTIONS } from "@/feature/categories/types/category.types";
import { CategoriesViewModel } from "@/feature/categories/viewModel/categories.viewModel";
import { DashboardTabScaffold } from "@/feature/dashboard/shared/ui/DashboardTabScaffold";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { FilterChipGroup } from "@/shared/components/reusable/Form/FilterChipGroup";
import { Pill } from "@/shared/components/reusable/List/Pill";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { CategoryEditorModal } from "./components/CategoryEditorModal";

const getCategoryTint = (kind: string) => {
  switch (kind) {
    case CategoryKind.Income:
    case CategoryKind.Business:
    case CategoryKind.Product:
      return { backgroundColor: colors.accent, iconColor: colors.primary };
    case CategoryKind.Expense:
      return { backgroundColor: "#FBE4E4", iconColor: colors.destructive };
    default:
      return { backgroundColor: colors.accent, iconColor: colors.primary };
  }
};

export function CategoriesScreen({ viewModel }: { viewModel: CategoriesViewModel }) {
  return (
    <DashboardTabScaffold
      footer={null}
      baseBottomPadding={110}
      contentContainerStyle={null}
      showDivider={false}
    >
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Categories</Text>
      </View>

      <FilterChipGroup
        options={CATEGORY_FILTER_OPTIONS.filter(
          (option) =>
            option.value === "all" ||
            viewModel.categories.some((category) => category.kind === option.value),
        )}
        selectedValue={viewModel.selectedKind}
        onSelect={viewModel.onFilterChange}
      />

      {viewModel.errorMessage ? <Text style={styles.errorText}>{viewModel.errorMessage}</Text> : null}
      {viewModel.isLoading ? <ActivityIndicator color={colors.primary} /> : null}

      <Card style={styles.listCard}>
        {viewModel.filteredCategories.length === 0 ? (
          <Text style={styles.emptyText}>No categories available yet.</Text>
        ) : (
          viewModel.filteredCategories.map((category, index) => {
            const tint = getCategoryTint(category.kind);
            const isLast = index === viewModel.filteredCategories.length - 1;

            return (
              <Pressable
                key={category.remoteId}
                style={[styles.row, !isLast ? styles.rowBorder : null]}
                onPress={() => viewModel.onOpenEdit(category)}
              >
                <View style={[styles.iconWrap, { backgroundColor: tint.backgroundColor }]}>
                  <Tags size={18} color={tint.iconColor} />
                </View>
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowTitle}>{category.name}</Text>
                  <Text style={styles.rowSubtitle}>{category.kind.charAt(0).toUpperCase() + category.kind.slice(1)}</Text>
                </View>
                {category.isSystem ? <Pill label="System" tone="neutral" /> : null}
              </Pressable>
            );
          })
        )}
      </Card>

      <AppButton label="Add Category" variant="primary" size="lg" onPress={viewModel.onOpenCreate} disabled={!viewModel.canCreate} />

      <CategoryEditorModal
        visible={viewModel.isEditorVisible}
        title={viewModel.editorTitle}
        form={viewModel.form}
        allowedKinds={viewModel.categories.some((item) => item.kind === CategoryKind.Business) || viewModel.categories.some((item) => item.kind === CategoryKind.Product) ? [CategoryKind.Income, CategoryKind.Expense, CategoryKind.Business, CategoryKind.Product] : [CategoryKind.Income, CategoryKind.Expense]}
        onClose={viewModel.onCloseEditor}
        onChange={viewModel.onFormChange}
        onSubmit={viewModel.onSubmit}
      />
    </DashboardTabScaffold>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: colors.header,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  headerTitle: {
    color: colors.headerForeground,
    fontSize: 20,
    fontFamily: "InterBold",
  },
  listCard: {
    paddingVertical: 0,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTextWrap: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: colors.cardForeground,
    fontSize: 15,
    fontFamily: "InterBold",
  },
  rowSubtitle: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontFamily: "InterMedium",
  },
  errorText: {
    color: colors.destructive,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 14,
    fontFamily: "InterMedium",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
});
