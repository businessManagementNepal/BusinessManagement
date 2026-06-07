import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { ProfileScreenViewModel } from "@/feature/profile/screen/viewModel/profileScreen.viewModel";
import { useToastMessage } from "@/shared/components/reusable/Feedback/useToastMessage";
import { PrimaryHeader } from "@/shared/components/reusable/ScreenLayouts/PrimaryHeader";
import { ScreenContainer } from "@/shared/components/reusable/ScreenLayouts/ScreenContainer";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { Building2, UserRound } from "lucide-react-native";
import React from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { resolveActiveAccountType } from "./profileScreen.util";
import { AccountSwitchSection } from "./sections/AccountSwitchSection";
import { BusinessProfileSection } from "./sections/BusinessProfileSection";
import { CreateBusinessProfileSection } from "./sections/CreateBusinessProfileSection";
import { PersonalProfileSection } from "./sections/PersonalProfileSection";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";

type ProfileScreenProps = {
  viewModel: ProfileScreenViewModel;
};

export function ProfileScreen({ viewModel }: ProfileScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  useToastMessage({
    message: viewModel.successMessage,
    type: "success",
  });

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
      keyboardSafe={true}
    >
      {viewModel.isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : null}

      {viewModel.loadError ? (
        <Text style={styles.errorText}>{viewModel.loadError}</Text>
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
              <Building2 size={13} color={theme.colors.primary} />
            ) : (
              <UserRound size={13} color={theme.colors.primary} />
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

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  scrollContent: {
    paddingHorizontal: theme.scaleSpace(spacing.lg),
    paddingTop: theme.scaleSpace(spacing.lg),
    gap: theme.scaleSpace(spacing.md),
  },
  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.scaleSpace(spacing.sm),
    paddingVertical: theme.scaleSpace(spacing.sm),
  },
  loadingText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.scaleText(13),
    fontWeight: "500",
  },
  errorText: {
    color: theme.colors.destructive,
    fontSize: theme.scaleText(13),
    fontWeight: "600",
  },
  heroWrap: {
    alignItems: "center",
    gap: theme.scaleSpace(4),
    paddingVertical: theme.scaleSpace(spacing.sm),
  },
  avatarCircle: {
    width: theme.scaleSpace(78),
    height: theme.scaleSpace(78),
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: theme.isDarkMode ? "rgba(99, 211, 148, 0.32)" : "#A8CBB7",
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: {
    color: theme.colors.primary,
    fontSize: theme.scaleText(16),
    fontFamily: "InterBold",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: radius.pill,
  },
  heroName: {
    marginTop: theme.scaleSpace(spacing.xs),
    color: theme.colors.cardForeground,
    fontSize: theme.scaleText(14),
    fontFamily: "InterBold",
  },
  heroEmail: {
    color: theme.colors.mutedForeground,
    fontSize: theme.scaleText(13),
    fontFamily: "InterMedium",
  },
  heroAccountChip: {
    marginTop: theme.scaleSpace(spacing.xs),
    flexDirection: "row",
    alignItems: "center",
    gap: theme.scaleSpace(6),
    paddingHorizontal: theme.scaleSpace(spacing.sm),
    paddingVertical: theme.scaleSpace(4),
    borderRadius: radius.pill,
    backgroundColor: theme.colors.accent,
  },
  heroAccountChipText: {
    color: theme.colors.primary,
    fontSize: theme.scaleText(11),
    fontFamily: "InterSemiBold",
  },
});
