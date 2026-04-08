import { PrimaryHeader } from "@/shared/components/reusable/ScreenLayouts/PrimaryHeader";
import { ScreenContainer } from "@/shared/components/reusable/ScreenLayouts/ScreenContainer";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import {
  Bug,
  ChevronRight,
  CircleHelp,
  LockKeyhole,
  ShieldCheck,
  Star,
} from "lucide-react-native";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SettingsViewModel } from "../viewModel/settings.viewModel";
import { SettingsModal } from "../types/settings.types";
import { ChangePasswordModal } from "./components/ChangePasswordModal";
import { HelpFaqModal } from "./components/HelpFaqModal";
import { RateELekhaModal } from "./components/RateELekhaModal";
import { ReportBugModal } from "./components/ReportBugModal";
import { SecurityModal } from "./components/SecurityModal";
import { TermsPrivacyModal } from "./components/TermsPrivacyModal";

type SettingsScreenProps = {
  viewModel: SettingsViewModel;
  onBack: () => void;
};

const getIcon = (id: SettingsViewModel["settingsRows"][number]["id"]) => {
  switch (id) {
    case "security":
      return <LockKeyhole size={18} color={colors.primary} />;
    case "helpFaq":
      return <CircleHelp size={18} color={colors.primary} />;
    case "termsPrivacy":
      return <ShieldCheck size={18} color={colors.primary} />;
    case "rateELekha":
      return <Star size={18} color={colors.primary} fill={colors.primary} />;
    case "reportBug":
      return <Bug size={18} color={colors.primary} />;
    default:
      return <LockKeyhole size={18} color={colors.primary} />;
  }
};

export function SettingsScreen({ viewModel, onBack }: SettingsScreenProps) {
  const onRowPress = (
    id: SettingsViewModel["settingsRows"][number]["id"],
  ): void => {
    switch (id) {
      case "security":
        viewModel.onOpenSecurity();
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
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>{viewModel.sectionTitle}</Text>

          <Card style={styles.listCard}>
            {viewModel.settingsRows.map((row, index) => {
              const isLast = index === viewModel.settingsRows.length - 1;

              return (
                <Pressable
                  key={row.id}
                  style={[styles.row, !isLast ? styles.rowBorder : null]}
                  onPress={() => onRowPress(row.id)}
                  accessibilityRole="button"
                >
                  <View style={styles.iconWrap}>{getIcon(row.id)}</View>
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.rowTitle}>{row.title}</Text>
                    <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </Pressable>
              );
            })}
          </Card>
        </View>

        {viewModel.isLoading ? (
          <View style={styles.feedbackRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.feedbackText}>Loading settings...</Text>
          </View>
        ) : null}

        {viewModel.errorMessage && viewModel.activeModal === SettingsModal.None ? (
          <Text style={styles.errorText}>{viewModel.errorMessage}</Text>
        ) : null}

        {viewModel.successMessage && viewModel.activeModal === SettingsModal.None ? (
          <Text style={styles.successText}>{viewModel.successMessage}</Text>
        ) : null}
      </ScreenContainer>

      <SecurityModal
        visible={viewModel.activeModal === SettingsModal.Security}
        errorMessage={viewModel.errorMessage}
        successMessage={viewModel.successMessage}
        isSavingPreference={viewModel.isSavingPreference}
        passwordChangedLabel={viewModel.passwordChangedLabel}
        biometricLoginEnabled={viewModel.biometricLoginEnabled}
        twoFactorAuthEnabled={viewModel.twoFactorAuthEnabled}
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
        successMessage={viewModel.successMessage}
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
        successMessage={viewModel.successMessage}
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
        successMessage={viewModel.successMessage}
        onClose={viewModel.onCloseModal}
        onChange={viewModel.onReportBugFieldChange}
        onSubmit={viewModel.onSubmitBugReport}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
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
  listCard: {
    padding: 0,
    overflow: "hidden",
  },
  row: {
    minHeight: 72,
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
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  rowTextWrap: {
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
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  feedbackText: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontFamily: "InterMedium",
  },
  errorText: {
    color: colors.destructive,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "InterSemiBold",
  },
  successText: {
    color: colors.success,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "InterSemiBold",
  },
});
