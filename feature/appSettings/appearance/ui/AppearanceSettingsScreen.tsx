import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Palette, ChevronRight } from "lucide-react-native";
import { DashboardInfoCard, DashboardTabScaffold } from "@/feature/dashboard/shared/ui/DashboardTabScaffold";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { AppearanceSettingsViewModel } from "@/feature/appSettings/appearance/viewModel/appearance.viewModel";
import { AppearanceModal } from "./components/AppearanceModal";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";

type AppearanceSettingsScreenProps = {
  viewModel: AppearanceSettingsViewModel;
};

export function AppearanceSettingsScreen({
  viewModel,
}: AppearanceSettingsScreenProps) {
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
          <Text style={styles.sectionTitle}>{viewModel.settingsSectionTitle}</Text>

          {viewModel.isLoading ? (
            <DashboardInfoCard
              title="Loading appearance"
              description="Please wait while settings are prepared."
            />
          ) : (
            <Card style={styles.sectionCard}>
              <Pressable
                style={styles.row}
                onPress={viewModel.onOpenAppearance}
                accessibilityRole="button"
              >
                <View style={styles.iconWrap}>
                  <Palette size={18} color={theme.colors.primary} />
                </View>

                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{viewModel.appearanceTitle}</Text>
                  <Text style={styles.rowSubtitle}>{viewModel.appearanceSubtitle}</Text>
                  <Text style={styles.rowValue}>{viewModel.appearanceSummaryLabel}</Text>
                </View>

                <ChevronRight size={16} color={theme.colors.mutedForeground} />
              </Pressable>
            </Card>
          )}

          {viewModel.errorMessage && !viewModel.isAppearanceVisible ? (
            <DashboardInfoCard
              title="Appearance unavailable"
              description={viewModel.errorMessage}
            />
          ) : null}
        </View>
      </DashboardTabScaffold>

      <AppearanceModal
        visible={viewModel.isAppearanceVisible}
        isSaving={viewModel.isSaving}
        title={viewModel.appearanceModalTitle}
        subtitle={viewModel.appearanceModalSubtitle}
        errorMessage={viewModel.errorMessage}
        selectedThemePreference={viewModel.selectedThemePreference}
        selectedTextSizePreference={viewModel.selectedTextSizePreference}
        compactModeEnabled={viewModel.compactModeEnabled}
        compactModeTitle={viewModel.compactModeTitle}
        compactModeSubtitle={viewModel.compactModeSubtitle}
        onClose={viewModel.onCloseAppearance}
        onSelectThemePreference={viewModel.onSelectThemePreference}
        onSelectTextSizePreference={viewModel.onSelectTextSizePreference}
        onToggleCompactMode={viewModel.onToggleCompactMode}
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
      minHeight: 78,
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
    rowValue: {
      marginTop: 6,
      color: theme.colors.primary,
      fontSize: theme.scaleText(12),
      fontFamily: "InterSemiBold",
    },
  });
