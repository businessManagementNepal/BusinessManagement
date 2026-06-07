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
import { ConfirmDeleteModal } from "@/shared/components/reusable/Modals/ConfirmDeleteModal";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import { CategoryEditorModal } from "./components/CategoryEditorModal";

const getCategoryTint = (
  theme: ReturnType<typeof useAppTheme>,
  kind: string,
): { backgroundColor: string; iconColor: string } => {
  switch (kind) {
    case CategoryKind.Income:
    case CategoryKind.Business:
    case CategoryKind.Product:
      return {
        backgroundColor: theme.colors.accent,
        iconColor: theme.colors.primary,
      };
    case CategoryKind.Expense:
      return {
        backgroundColor: theme.isDarkMode
          ? "rgba(255, 107, 107, 0.16)"
          : "#FBE4E4",
        iconColor: theme.colors.destructive,
      };
    default:
      return {
        backgroundColor: theme.colors.accent,
        iconColor: theme.colors.primary,
      };
  }
};

const toCategoryKindLabel = (kind: CategoryKindValue): string => {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
};

export function CategoriesScreen({
  viewModel,
}: {
  viewModel: CategoriesViewModel;
}): React.ReactElement {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

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
              leadingIcon={
                <Plus size={18} color={theme.colors.primaryForeground} />
              }
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
              viewModel.categories.some(
                (category) => category.kind === option.value,
              ),
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
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : viewModel.filteredCategories.length === 0 ? (
            <Text style={styles.emptyText}>No categories available yet.</Text>
          ) : (
            viewModel.filteredCategories.map((category, index) => {
              const tint = getCategoryTint(theme, category.kind);
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
        allowedKinds={viewModel.allowedKinds}
        isEditMode={viewModel.editorMode === "edit"}
        isDeleting={viewModel.isDeleting}
        canDelete={viewModel.canCreate && viewModel.editorMode === "edit"}
        onClose={viewModel.onCloseEditor}
        onChange={viewModel.onFormChange}
        onSubmit={viewModel.onSubmit}
        onDelete={viewModel.onRequestDeleteFromEditor}
      />

      <ConfirmDeleteModal
        visible={viewModel.isDeleteModalVisible}
        title="Delete category?"
        message={
          viewModel.pendingDeleteCategoryName
            ? `Delete ${viewModel.pendingDeleteCategoryName}? This action cannot be undone.`
            : "Delete this category? This action cannot be undone."
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDeleting={viewModel.isDeleting}
        errorMessage={viewModel.deleteErrorMessage}
        onCancel={viewModel.onCloseDeleteModal}
        onConfirm={() => void viewModel.onConfirmDelete()}
      />
    </>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    content: {
      gap: theme.scaleSpace(spacing.sm),
    },
    primaryActionButton: {
      width: "100%",
    },
    filterScroll: {
      flexGrow: 0,
      flexShrink: 0,
      minHeight: theme.scaleSpace(42),
      maxHeight: theme.scaleSpace(42),
    },
    filterRow: {
      gap: theme.scaleSpace(spacing.xs),
      alignItems: "center",
      paddingVertical: theme.scaleSpace(2),
    },
    filterChip: {
      minHeight: theme.scaleSpace(34),
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      paddingHorizontal: theme.scaleSpace(spacing.md),
    },
    filterChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    filterChipText: {
      color: theme.colors.foreground,
      fontSize: theme.scaleText(12),
      fontFamily: "InterMedium",
    },
    filterChipTextActive: {
      color: theme.colors.primaryForeground,
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
      gap: theme.scaleSpace(spacing.sm),
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.md),
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    iconWrap: {
      width: theme.scaleSpace(46),
      height: theme.scaleSpace(46),
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    rowTextWrap: {
      flex: 1,
      gap: theme.scaleSpace(4),
    },
    rowTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(15),
      fontFamily: "InterBold",
    },
    rowSubtitle: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      fontFamily: "InterMedium",
    },
    errorText: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(12),
      fontFamily: "InterMedium",
    },
    centerState: {
      minHeight: theme.scaleSpace(150),
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.scaleSpace(spacing.md),
    },
    emptyText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
      fontFamily: "InterMedium",
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.lg),
    },
  });
