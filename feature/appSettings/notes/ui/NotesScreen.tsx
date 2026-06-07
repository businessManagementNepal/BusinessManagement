import { DashboardInfoCard, DashboardTabScaffold } from "@/feature/dashboard/shared/ui/DashboardTabScaffold";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import { ChevronRight, StickyNote } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BusinessNotesViewModel } from "../viewModel/notes.viewModel";
import { BusinessNotesModal } from "./components/BusinessNotesModal";

type NotesScreenProps = {
  viewModel: BusinessNotesViewModel;
};

export function NotesScreen({ viewModel }: NotesScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <>
      <DashboardTabScaffold
        footer={null}
        baseBottomPadding={110}
        contentContainerStyle={null}
        showDivider={false}
      >
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Utilities</Text>

          {viewModel.isLoading ? (
            <DashboardInfoCard
              title="Loading notes"
              description="Please wait while notes are prepared."
            />
          ) : (
            <Card style={styles.sectionCard}>
              <Pressable
                style={styles.row}
                onPress={viewModel.onOpenNotes}
                accessibilityRole="button"
              >
                <View style={styles.iconWrap}>
                  <StickyNote size={18} color={theme.colors.primary} />
                </View>

                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{viewModel.toolTitle}</Text>
                  <Text style={styles.rowSubtitle}>{viewModel.toolSubtitle}</Text>
                </View>

                <ChevronRight size={16} color={theme.colors.mutedForeground} />
              </Pressable>
            </Card>
          )}

          {viewModel.errorMessage && !viewModel.isNotesVisible ? (
            <DashboardInfoCard
              title="Notes unavailable"
              description={viewModel.errorMessage}
            />
          ) : null}
        </View>
      </DashboardTabScaffold>

      <BusinessNotesModal
        visible={viewModel.isNotesVisible}
        title={viewModel.modalTitle}
        placeholder={viewModel.modalPlaceholder}
        notesInput={viewModel.notesInput}
        errorMessage={viewModel.errorMessage}
        saveButtonLabel={viewModel.saveButtonLabel}
        isSaving={viewModel.isSaving}
        onNotesChange={viewModel.onNotesChange}
        onClose={viewModel.onCloseNotes}
        onSave={viewModel.onSaveNotes}
      />
    </>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    sectionWrap: {
      gap: theme.scaleSpace(spacing.sm),
    },
    sectionTitle: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      fontFamily: "InterBold",
      letterSpacing: 0.7,
      textTransform: "uppercase",
    },
    sectionCard: {
      padding: 0,
    },
    row: {
      minHeight: 72,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.md),
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.sm),
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.accent,
    },
    rowBody: {
      flex: 1,
    },
    rowTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(15),
      fontFamily: "InterBold",
      marginBottom: 2,
    },
    rowSubtitle: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(17),
      fontFamily: "InterMedium",
    },
  });
