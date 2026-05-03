import { AppearanceModal } from "@/feature/appSettings/appearance/ui/components/AppearanceModal";
import { useToastMessage } from "@/shared/components/reusable/Feedback/useToastMessage";
import { PrimaryHeader } from "@/shared/components/reusable/ScreenLayouts/PrimaryHeader";
import { ScreenContainer } from "@/shared/components/reusable/ScreenLayouts/ScreenContainer";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import {
  Bug,
  ChevronRight,
  CircleHelp,
  Download,
  Landmark,
  LockKeyhole,
  Palette,
  ShieldCheck,
  Star,
  Upload,
} from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SettingsModal } from "../types/settings.types";
import { SettingsRowId, SettingsViewModel } from "../viewModel/settings.viewModel";
import { ChangePasswordModal } from "./components/ChangePasswordModal";
import { ExportDataModal } from "./components/ExportDataModal";
import { HelpFaqModal } from "./components/HelpFaqModal";
import { RateELekhaModal } from "./components/RateELekhaModal";
import { RegionalFinanceModal } from "./components/RegionalFinanceModal";
import { ReportBugModal } from "./components/ReportBugModal";
import { SecurityModal } from "./components/SecurityModal";
import { TermsPrivacyModal } from "./components/TermsPrivacyModal";

type SettingsScreenProps = {
  viewModel: SettingsViewModel;
  onBack: () => void;
  importDataFlow?: React.ReactNode;
  syncStatusPanel?: React.ReactNode;
};

const getIcon = (
  id: SettingsRowId,
  colorPalette: ReturnType<typeof useAppTheme>["colors"],
) => {
  switch (id) {
    case "appearance":
      return <Palette size={18} color={colorPalette.primary} />;
    case "security":
      return <LockKeyhole size={18} color={colorPalette.primary} />;
    case "regionalFinance":
      return <Landmark size={18} color={colorPalette.primary} />;
    case "exportData":
      return <Download size={18} color={colorPalette.primary} />;
    case "importData":
      return <Upload size={18} color={colorPalette.primary} />;
    case "helpFaq":
      return <CircleHelp size={18} color={colorPalette.primary} />;
    case "termsPrivacy":
      return <ShieldCheck size={18} color={colorPalette.primary} />;
    case "rateELekha":
      return (
        <Star
          size={18}
          color={colorPalette.primary}
          fill={colorPalette.primary}
        />
      );
    case "reportBug":
      return <Bug size={18} color={colorPalette.primary} />;
    default:
      return <LockKeyhole size={18} color={colorPalette.primary} />;
  }
};

export function SettingsScreen({
  viewModel,
  onBack,
  importDataFlow,
  syncStatusPanel,
}: SettingsScreenProps) {
  useToastMessage({
    message:
      viewModel.activeModal === SettingsModal.None
        ? viewModel.successMessage
        : null,
    type: "success",
  });

  const theme = useAppTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        content: {
          paddingHorizontal: theme.scaleSpace(spacing.lg),
          paddingTop: theme.scaleSpace(spacing.lg),
          gap: theme.scaleSpace(spacing.md),
        },
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
        listCard: {
          padding: 0,
          overflow: "hidden",
        },
        row: {
          minHeight: theme.scaleSpace(72),
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
          width: theme.scaleSpace(40),
          height: theme.scaleSpace(40),
          borderRadius: radius.pill,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.accent,
        },
        rowTextWrap: {
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
          marginTop: theme.scaleSpace(6),
          color: theme.colors.primary,
          fontSize: theme.scaleText(12),
          fontFamily: "InterSemiBold",
        },
        feedbackRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.scaleSpace(spacing.sm),
        },
        feedbackText: {
          color: theme.colors.mutedForeground,
          fontSize: theme.scaleText(13),
          fontFamily: "InterMedium",
        },
        errorText: {
          color: theme.colors.destructive,
          fontSize: theme.scaleText(13),
          lineHeight: theme.scaleLineHeight(18),
          fontFamily: "InterSemiBold",
        },
      }),
    [theme],
  );

  const onRowPress = (id: SettingsRowId): void => {
    switch (id) {
      case "appearance":
        viewModel.onOpenAppearance();
        return;
      case "security":
        viewModel.onOpenSecurity();
        return;
      case "regionalFinance":
        viewModel.onOpenRegionalFinance();
        return;
      case "exportData":
        viewModel.onOpenExportData();
        return;
      case "importData":
        viewModel.onOpenImportData();
        return;
      case "helpFaq":
        viewModel.onOpenHelpFaq();
        return;
      case "termsPrivacy":
        viewModel.onOpenTermsPrivacy();
        return;
      case "rateELekha":
        viewModel.onOpenRateELekha();
        return;
      case "reportBug":
        viewModel.onOpenReportBug();
        return;
      default:
        return;
    }
  };

  return (
    <>
      <ScreenContainer
        header={
          <PrimaryHeader
            title={viewModel.pageTitle}
            showBack={true}
            onBack={onBack}
            showBell={false}
            showProfile={false}
          />
        }
        contentContainerStyle={styles.content}
        baseBottomPadding={spacing.xxl}
      >
        {syncStatusPanel}

        {viewModel.settingsSections.map((section) => (
          <View key={section.id} style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            <Card style={styles.listCard}>
              {section.rows.map((row, index) => {
                const isLast = index === section.rows.length - 1;

                return (
                  <Pressable
                    key={row.id}
                    style={[styles.row, !isLast ? styles.rowBorder : null]}
                    onPress={() => onRowPress(row.id)}
                    accessibilityRole="button"
                  >
                    <View style={styles.iconWrap}>
                      {getIcon(row.id, theme.colors)}
                    </View>
                    <View style={styles.rowTextWrap}>
                      <Text style={styles.rowTitle}>{row.title}</Text>
                      <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
                      {row.id === "appearance" ? (
                        <Text style={styles.rowValue}>
                          {viewModel.appearanceSummaryLabel}
                        </Text>
                      ) : null}
                      {row.id === "regionalFinance" ? (
                        <Text style={styles.rowValue}>
                          {viewModel.regionalFinanceSummaryLabel}
                        </Text>
                      ) : null}
                    </View>
                    <ChevronRight
                      size={16}
                      color={theme.colors.mutedForeground}
                    />
                  </Pressable>
                );
              })}
            </Card>
          </View>
        ))}

        {viewModel.isLoading ? (
          <View style={styles.feedbackRow}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.feedbackText}>Loading settings...</Text>
          </View>
        ) : null}

        {viewModel.errorMessage && viewModel.activeModal === SettingsModal.None ? (
          <Text style={styles.errorText}>{viewModel.errorMessage}</Text>
        ) : null}
      </ScreenContainer>

      <AppearanceModal
        visible={viewModel.activeModal === SettingsModal.Appearance}
        isSaving={viewModel.isSavingAppearance}
        title={viewModel.appearanceModalTitle}
        subtitle={viewModel.appearanceModalSubtitle}
        errorMessage={viewModel.errorMessage}
        successMessage={viewModel.successMessage}
        selectedThemePreference={viewModel.selectedThemePreference}
        selectedTextSizePreference={viewModel.selectedTextSizePreference}
        compactModeEnabled={viewModel.compactModeEnabled}
        compactModeTitle={viewModel.compactModeTitle}
        compactModeSubtitle={viewModel.compactModeSubtitle}
        onClose={viewModel.onCloseModal}
        onSelectThemePreference={viewModel.onSelectThemePreference}
        onSelectTextSizePreference={viewModel.onSelectTextSizePreference}
        onToggleCompactMode={viewModel.onToggleCompactMode}
      />

      <RegionalFinanceModal
        visible={viewModel.activeModal === SettingsModal.RegionalFinance}
        isSaving={viewModel.isSavingRegionalFinance}
        title={viewModel.regionalFinanceModalTitle}
        subtitle={viewModel.regionalFinanceModalSubtitle}
        errorMessage={viewModel.errorMessage}
        settings={viewModel.regionalFinanceSettings}
        countryOptions={viewModel.regionalFinanceCountryOptions}
        currencyOptions={viewModel.regionalFinanceCurrencyOptions}
        taxRateOptions={viewModel.regionalFinanceTaxRateOptions}
        taxModeOptions={viewModel.regionalFinanceTaxModeOptions}
        onClose={viewModel.onCloseModal}
        onChangeCountry={viewModel.onChangeRegionalFinanceCountry}
        onChangeCurrency={viewModel.onChangeRegionalFinanceCurrency}
        onChangeTaxRate={viewModel.onChangeRegionalFinanceTaxRate}
        onChangeTaxMode={viewModel.onChangeRegionalFinanceTaxMode}
        onSave={viewModel.onSaveRegionalFinance}
      />

      <ExportDataModal
        visible={viewModel.activeModal === SettingsModal.ExportData}
        subtitle={viewModel.exportDataModalSubtitle}
        format={viewModel.exportDataFormat}
        moduleSelections={viewModel.exportDataModuleSelections}
        isExporting={viewModel.isExportingData}
        errorMessage={viewModel.errorMessage}
        onClose={viewModel.onCloseModal}
        onChangeFormat={viewModel.onChangeExportDataFormat}
        onToggleModule={viewModel.onToggleExportDataModule}
        onSubmit={viewModel.onSubmitExportData}
      />

      {importDataFlow}

      <SecurityModal
        visible={viewModel.activeModal === SettingsModal.Security}
        errorMessage={viewModel.errorMessage}
        successMessage={viewModel.successMessage}
        isSavingPreference={viewModel.isSavingPreference}
        passwordChangedLabel={viewModel.passwordChangedLabel}
        biometricLoginEnabled={viewModel.biometricLoginEnabled}
        biometricLoginSubtitle={viewModel.biometricLoginSubtitle}
        biometricLoginToggleDisabled={viewModel.biometricLoginToggleDisabled}
        twoFactorAuthEnabled={viewModel.twoFactorAuthEnabled}
        twoFactorAuthSubtitle={viewModel.twoFactorAuthSubtitle}
        twoFactorAuthToggleDisabled={viewModel.twoFactorAuthToggleDisabled}
        securitySessions={viewModel.securitySessions}
        onClose={viewModel.onCloseModal}
        onOpenChangePassword={viewModel.onOpenChangePassword}
        onToggleBiometricLogin={viewModel.onToggleBiometricLogin}
        onToggleTwoFactorAuth={viewModel.onToggleTwoFactorAuth}
      />

      <ChangePasswordModal
        visible={viewModel.activeModal === SettingsModal.ChangePassword}
        form={viewModel.changePasswordForm}
        isSubmitting={viewModel.isChangingPassword}
        errorMessage={viewModel.errorMessage}
        onClose={viewModel.onCloseModal}
        onChange={viewModel.onChangePasswordField}
        onSubmit={viewModel.onSubmitPasswordChange}
      />

      <HelpFaqModal
        visible={viewModel.activeModal === SettingsModal.HelpFaq}
        items={viewModel.helpFaqItems}
        supportContacts={viewModel.supportContactItems}
        onClose={viewModel.onCloseModal}
      />

      <TermsPrivacyModal
        visible={viewModel.activeModal === SettingsModal.TermsPrivacy}
        items={viewModel.termsDocumentItems}
        dataRights={viewModel.dataRightItems}
        onClose={viewModel.onCloseModal}
      />

      <RateELekhaModal
        visible={viewModel.activeModal === SettingsModal.RateELekha}
        ratingValue={viewModel.ratingValue}
        review={viewModel.ratingReview}
        isSubmitting={viewModel.isSubmittingRating}
        errorMessage={viewModel.errorMessage}
        onClose={viewModel.onCloseModal}
        onSelectRating={viewModel.onSelectRating}
        onReviewChange={viewModel.onRatingReviewChange}
        onSubmit={viewModel.onSubmitRating}
      />

      <ReportBugModal
        visible={viewModel.activeModal === SettingsModal.ReportBug}
        form={viewModel.reportBugForm}
        deviceInfoLabel={viewModel.deviceInfoLabel}
        appVersionLabel={viewModel.appVersionLabel}
        isSubmitting={viewModel.isSubmittingBugReport}
        errorMessage={viewModel.errorMessage}
        onClose={viewModel.onCloseModal}
        onChange={viewModel.onReportBugFieldChange}
        onSubmit={viewModel.onSubmitBugReport}
      />
    </>
  );
}
