import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { ProfileScreenViewModel } from "@/feature/profile/screen/viewModel/profileScreen.viewModel";
import { PrimaryHeader } from "@/shared/components/reusable/ScreenLayouts/PrimaryHeader";
import { ScreenContainer } from "@/shared/components/reusable/ScreenLayouts/ScreenContainer";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { Building2, UserRound } from "lucide-react-native";
import React from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { resolveActiveAccountType } from "./profileScreen.util";
import { AccountSwitchSection } from "./sections/AccountSwitchSection";
import { BusinessProfileSection } from "./sections/BusinessProfileSection";
import { CreateBusinessProfileSection } from "./sections/CreateBusinessProfileSection";
import { PersonalProfileSection } from "./sections/PersonalProfileSection";

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

  const profileEmail = viewModel.personalProfileForm.email.trim();
  const profileImageUri = viewModel.personalProfileForm.profileImageUrl.trim();

  return (
    <ScreenContainer
      header={
        <PrimaryHeader
          title="Profile"
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
        <View style={styles.heroWrap}>
          <View style={styles.avatarCircle}>
            {profileImageUri.length > 0 ? (
              <Image
                source={{ uri: profileImageUri }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarLabel}>{viewModel.initials || "EL"}</Text>
            )}
          </View>
          <Text style={styles.heroName}>{viewModel.profileName}</Text>
          {profileEmail.length > 0 ? (
            <Text style={styles.heroEmail}>{profileEmail}</Text>
          ) : null}
          <View style={styles.heroAccountChip}>
            {isBusinessAccount ? (
              <Building2 size={13} color={colors.primary} />
            ) : (
              <UserRound size={13} color={colors.primary} />
            )}
            <Text style={styles.heroAccountChipText}>
              {isBusinessAccount
                ? viewModel.activeAccountDisplayName || "Business Account"
                : "Personal Account"}
            </Text>
          </View>
        </View>
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

      {!viewModel.isLoading && !isBusinessAccount ? (
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
          activeBusinessEstablishedYear={
            viewModel.activeBusinessEstablishedYear
          }
          hasActiveBusinessProfile={viewModel.hasActiveBusinessProfile}
          canEditBusinessProfile={viewModel.canEditBusinessProfile}
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
          createBusinessProfileFieldErrors={
            viewModel.createBusinessProfileFieldErrors
          }
          isCreateBusinessExpanded={viewModel.isCreateBusinessExpanded}
          isCreatingBusinessProfile={viewModel.isCreatingBusinessProfile}
          businessTypeOptions={viewModel.businessTypeOptions}
          onToggleCreateBusinessExpanded={
            viewModel.onToggleCreateBusinessExpanded
          }
          onUpdateCreateBusinessProfileField={
            viewModel.onUpdateCreateBusinessProfileField
          }
          onCreateBusinessProfile={viewModel.onCreateBusinessProfile}
        />
      ) : null}

    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
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
  heroWrap: {
    alignItems: "center",
    gap: 4,
    paddingVertical: spacing.sm,
  },
  avatarCircle: {
    width: 78,
    height: 78,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: "#A8CBB7",
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: {
    color: colors.primary,
    fontSize: 16,
    fontFamily: "InterBold",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: radius.pill,
  },
  heroName: {
    marginTop: spacing.xs,
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  heroEmail: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontFamily: "InterMedium",
  },
  heroAccountChip: {
    marginTop: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  heroAccountChipText: {
    color: colors.primary,
    fontSize: 11,
    fontFamily: "InterSemiBold",
  },
});
