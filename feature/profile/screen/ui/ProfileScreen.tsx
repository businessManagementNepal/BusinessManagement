import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AccountType } from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import { PrimaryHeader } from "@/shared/components/reusable/ScreenLayouts/PrimaryHeader";
import { ScreenContainer } from "@/shared/components/reusable/ScreenLayouts/ScreenContainer";
import { colors } from "@/shared/components/theme/colors";
import { spacing } from "@/shared/components/theme/spacing";
import { ProfileScreenViewModel } from "@/feature/profile/screen/viewModel/profileScreen.viewModel";
import { resolveActiveAccountType } from "./profileScreen.util";
import { AccountSwitchSection } from "./sections/AccountSwitchSection";
import { PersonalProfileSection } from "./sections/PersonalProfileSection";
import { BusinessProfileSection } from "./sections/BusinessProfileSection";
import { CreateBusinessProfileSection } from "./sections/CreateBusinessProfileSection";
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

      {!viewModel.isLoading && isBusinessAccount ? (
        <BusinessProfileSection
          activeBusinessProfileForm={viewModel.activeBusinessProfileForm}
          hasActiveBusinessProfile={viewModel.hasActiveBusinessProfile}
          isBusinessEditing={viewModel.isBusinessEditing}
          isSavingBusinessProfile={viewModel.isSavingBusinessProfile}
          businessTypeOptions={viewModel.businessTypeOptions}
          onStartBusinessEdit={viewModel.onStartBusinessEdit}
          onCancelBusinessEdit={viewModel.onCancelBusinessEdit}
          onUpdateBusinessProfileField={viewModel.onUpdateBusinessProfileField}
          onSaveBusinessProfile={viewModel.onSaveBusinessProfile}
        />
      ) : null}

      {!viewModel.isLoading ? (
        <CreateBusinessProfileSection
          createBusinessProfileForm={viewModel.createBusinessProfileForm}
          isCreateBusinessExpanded={viewModel.isCreateBusinessExpanded}
          isCreatingBusinessProfile={viewModel.isCreatingBusinessProfile}
          businessTypeOptions={viewModel.businessTypeOptions}
          onToggleCreateBusinessExpanded={viewModel.onToggleCreateBusinessExpanded}
          onUpdateCreateBusinessProfileField={
            viewModel.onUpdateCreateBusinessProfileField
          }
          onCreateBusinessProfile={viewModel.onCreateBusinessProfile}
        />
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
});
