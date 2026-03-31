import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { ChevronRight, Store } from "lucide-react-native";
import { AccountType } from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import { CardPressable } from "@/shared/components/reusable/Cards/Card";
import { PrimaryHeader } from "@/shared/components/reusable/ScreenLayouts/PrimaryHeader";
import { ScreenContainer } from "@/shared/components/reusable/ScreenLayouts/ScreenContainer";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { ProfileScreenViewModel } from "@/feature/profile/screen/viewModel/profileScreen.viewModel";
import { resolveActiveAccountType } from "./profileScreen.util";
import { AccountSwitchSection } from "./sections/AccountSwitchSection";
import { PersonalProfileSection } from "./sections/PersonalProfileSection";
import { ProfileActionsSection } from "./sections/ProfileActionsSection";

type ProfileScreenProps = {
  viewModel: ProfileScreenViewModel;
};

export function ProfileScreen({ viewModel }: ProfileScreenProps) {
  const isBusinessAccount =
    resolveActiveAccountType(
      viewModel.activeAccountTypeLabel,
      viewModel.accountOptions,
      viewModel.activeAccountRemoteId,
    ) === AccountType.Business;

  const headerTitle =
    isBusinessAccount && viewModel.activeAccountDisplayName.trim().length > 0
      ? viewModel.activeAccountDisplayName
      : viewModel.profileName;

  const headerSubtitle = isBusinessAccount
    ? viewModel.profileName
    : viewModel.roleLabel;

  return (
    <ScreenContainer
      header={
        <PrimaryHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          showBack
          onBack={viewModel.onBack}
          showBell={false}
          showProfile={false}
        />
      }
      contentContainerStyle={styles.scrollContent}
      baseBottomPadding={spacing.xxl}
    >
      {viewModel.isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : null}

      {viewModel.loadError ? (
        <Text style={styles.errorText}>{viewModel.loadError}</Text>
      ) : null}

      {viewModel.successMessage ? (
        <Text style={styles.successText}>{viewModel.successMessage}</Text>
      ) : null}

      {!viewModel.isLoading ? (
        <AccountSwitchSection
          activeAccountTypeLabel={viewModel.activeAccountTypeLabel}
          activeAccountDisplayName={viewModel.activeAccountDisplayName}
          activeAccountRemoteId={viewModel.activeAccountRemoteId}
          accountOptions={viewModel.accountOptions}
          isSwitchExpanded={viewModel.isSwitchExpanded}
          onToggleSwitchExpanded={viewModel.onToggleSwitchExpanded}
          onSelectAccount={viewModel.onSelectAccount}
        />
      ) : null}

      {!viewModel.isLoading ? (
        <PersonalProfileSection
          personalProfileForm={viewModel.personalProfileForm}
          isPersonalEditing={viewModel.isPersonalEditing}
          isSavingPersonalProfile={viewModel.isSavingPersonalProfile}
          onStartPersonalEdit={viewModel.onStartPersonalEdit}
          onCancelPersonalEdit={viewModel.onCancelPersonalEdit}
          onUpdatePersonalProfileField={viewModel.onUpdatePersonalProfileField}
          onSavePersonalProfile={viewModel.onSavePersonalProfile}
        />
      ) : null}

      {!viewModel.isLoading ? (
        <CardPressable
          style={styles.businessDetailsCard}
          onPress={viewModel.onOpenBusinessDetails}
        >
          <View style={styles.businessDetailsBody}>
            <View style={styles.businessDetailsIconWrap}>
              <Store size={18} color={colors.primary} />
            </View>
            <View style={styles.businessDetailsCopy}>
              <Text style={styles.businessDetailsTitle}>Business Details</Text>
              <Text style={styles.businessDetailsSubtitle}>
                {isBusinessAccount
                  ? "Manage active business profile and workspace settings."
                  : "Create and manage your business workspace details."}
              </Text>
            </View>
          </View>
          <ChevronRight size={16} color={colors.mutedForeground} />
        </CardPressable>
      ) : null}

      {!viewModel.isLoading ? (
        <ProfileActionsSection onLogout={viewModel.onLogout} />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  loadingText: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontWeight: "500",
  },
  errorText: {
    color: colors.destructive,
    fontSize: 13,
    fontWeight: "600",
  },
  successText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: "600",
  },
  businessDetailsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  businessDetailsBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  businessDetailsIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  businessDetailsCopy: {
    flex: 1,
  },
  businessDetailsTitle: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  businessDetailsSubtitle: {
    marginTop: 2,
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 17,
  },
});

