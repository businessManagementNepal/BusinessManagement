import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Calculator, ChevronRight } from "lucide-react-native";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { DashboardInfoCard, DashboardTabScaffold } from "@/feature/dashboard/shared/ui/DashboardTabScaffold";
import { TaxCalculatorModal } from "./components/TaxCalculatorModal";
import { TaxCalculatorScreenViewModel } from "@/feature/appSettings/taxCalculator/viewModel/taxCalculator.viewModel";

type TaxCalculatorSettingsScreenProps = {
  viewModel: TaxCalculatorScreenViewModel;
};

export function TaxCalculatorSettingsScreen({
  viewModel,
}: TaxCalculatorSettingsScreenProps) {
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
              title="Loading tax presets"
              description="Please wait while the tax calculator tools are prepared."
            />
          ) : (
            <Card style={styles.sectionCard}>
              <Pressable
                style={styles.row}
                onPress={viewModel.onOpenCalculator}
                accessibilityRole="button"
              >
                <View style={styles.iconWrap}>
                  <Calculator size={18} color={colors.primary} />
                </View>

                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{viewModel.taxToolTitle}</Text>
                  <Text style={styles.rowSubtitle}>{viewModel.taxToolSubtitle}</Text>
                </View>

                <ChevronRight size={16} color={colors.mutedForeground} />
              </Pressable>
            </Card>
          )}

          {viewModel.errorMessage && !viewModel.isCalculatorVisible && viewModel.presetOptions.length === 0 ? (
            <DashboardInfoCard
              title="Tax calculator unavailable"
              description={viewModel.errorMessage}
            />
          ) : null}
        </View>
      </DashboardTabScaffold>

      <TaxCalculatorModal
        visible={viewModel.isCalculatorVisible}
        amountInput={viewModel.amountInput}
        amountInputPlaceholder={viewModel.amountInputPlaceholder}
        selectedMode={viewModel.selectedMode}
        selectedPresetCode={viewModel.selectedPresetCode}
        presetOptions={viewModel.presetOptions}
        errorMessage={viewModel.errorMessage}
        calculationSummary={viewModel.calculationSummary}
        onAmountChange={viewModel.onAmountChange}
        onModeChange={viewModel.onModeChange}
        onPresetChange={viewModel.onPresetChange}
        onClose={viewModel.onCloseCalculator}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionWrap: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterBold",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  sectionCard: {
    padding: 0,
  },
  row: {
    minHeight: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    color: colors.cardForeground,
    fontSize: 15,
    fontFamily: "InterBold",
    marginBottom: 2,
  },
  rowSubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "InterMedium",
  },
});
