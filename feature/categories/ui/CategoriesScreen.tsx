import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Plus, Tags } from "lucide-react-native";
import {
  CategoryKind,
  CategoryKindValue,
  CATEGORY_FILTER_OPTIONS,
} from "@/feature/categories/types/category.types";
import { CategoriesViewModel } from "@/feature/categories/viewModel/categories.viewModel";
import { DashboardTabScaffold } from "@/feature/dashboard/shared/ui/DashboardTabScaffold";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { FilterChipGroup } from "@/shared/components/reusable/Form/FilterChipGroup";
import { Pill } from "@/shared/components/reusable/List/Pill";
import { BottomTabAwareFooter } from "@/shared/components/reusable/ScreenLayouts/BottomTabAwareFooter";
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

const toCategoryKindLabel = (kind: CategoryKindValue): string => {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
};

export function CategoriesScreen({ viewModel }: { viewModel: CategoriesViewModel }) {
  const hasBusinessKinds =
    viewModel.categories.some((category) => category.kind === CategoryKind.Business) ||
    viewModel.categories.some((category) => category.kind === CategoryKind.Product);

  const allowedKinds = hasBusinessKinds
    ? [CategoryKind.Income, CategoryKind.Expense, CategoryKind.Business, CategoryKind.Product]
    : [CategoryKind.Income, CategoryKind.Expense];

  return (
    <>
      <DashboardTabScaffold
        footer={
          <BottomTabAwareFooter>
            <AppButton
              label="Add Category"
              variant="primary"
              size="lg"
              style={styles.primaryActionButton}
              leadingIcon={<Plus size={18} color={colors.primaryForeground} />}
              onPress={viewModel.onOpenCreate}
              disabled={!viewModel.canCreate}
            />
          </BottomTabAwareFooter>
        }
        baseBottomPadding={140}
        contentContainerStyle={styles.content}
        showDivider={false}
      >
        <FilterChipGroup
          options={CATEGORY_FILTER_OPTIONS.filter(
            (option) =>
              option.value === "all" ||
              viewModel.categories.some((category) => category.kind === option.value),
          )}
          selectedValue={viewModel.selectedKind}
          onSelect={viewModel.onFilterChange}
          scrollStyle={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
          chipStyle={styles.filterChip}
          selectedChipStyle={styles.filterChipActive}
          chipTextStyle={styles.filterChipText}
          selectedChipTextStyle={styles.filterChipTextActive}
        />

        {viewModel.errorMessage ? (
          <Text style={styles.errorText}>{viewModel.errorMessage}</Text>
        ) : null}

        <Card style={styles.listCard}>
          {viewModel.isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : viewModel.filteredCategories.length === 0 ? (
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
                  <View
                    style={[styles.iconWrap, { backgroundColor: tint.backgroundColor }]}
                  >
                    <Tags size={18} color={tint.iconColor} />
                  </View>
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.rowTitle}>{category.name}</Text>
                    <Text style={styles.rowSubtitle}>
                      {toCategoryKindLabel(category.kind)}
                    </Text>
                  </View>
                  {category.isSystem ? <Pill label="System" tone="neutral" /> : null}
                </Pressable>
              );
            })
          )}
        </Card>
      </DashboardTabScaffold>

      <CategoryEditorModal
        visible={viewModel.isEditorVisible}
        title={viewModel.editorTitle}
        form={viewModel.form}
        allowedKinds={allowedKinds}
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
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 42,
    maxHeight: 42,
  },
  filterRow: {
    gap: spacing.xs,
    alignItems: "center",
    paddingVertical: 2,
  },
  filterChip: {
    minHeight: 34,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  filterChipText: {
    color: colors.foreground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  filterChipTextActive: {
    color: colors.primaryForeground,
  },
  listCard: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    overflow: "hidden",
    borderRadius: radius.lg,
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
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  errorText: {
    color: colors.destructive,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  centerState: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontFamily: "InterMedium",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
});
