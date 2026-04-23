import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { ProfileScreenViewModel } from "@/feature/profile/screen/viewModel/profileScreen.viewModel";
import { PrimaryHeader } from "@/shared/components/reusable/ScreenLayouts/PrimaryHeader";
import { ScreenContainer } from "@/shared/components/reusable/ScreenLayouts/ScreenContainer";
import { colors } from "@/shared/components/theme/colors";
import { spacing } from "@/shared/components/theme/spacing";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { resolveActiveAccountType } from "./profileScreen.util";
import { BusinessProfileSection } from "./sections/BusinessProfileSection";
import { CreateBusinessProfileSection } from "./sections/CreateBusinessProfileSection";

type BusinessDetailsScreenProps = {
  viewModel: ProfileScreenViewModel;
};

export function BusinessDetailsScreen({
  viewModel,
}: BusinessDetailsScreenProps) {
  const isBusinessAccount =
    resolveActiveAccountType(
      viewModel.activeAccountTypeLabel,
      viewModel.accountOptions,
      viewModel.activeAccountRemoteId,
    ) === AccountType.Business;

  const subtitle = isBusinessAccount
    ? viewModel.activeAccountDisplayName
    : "Create and manage business workspaces";

  return (
    <ScreenContainer
      header={
        <PrimaryHeader
          title="Business Details"
          subtitle={subtitle}
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
          <Text style={styles.loadingText}>Loading business details...</Text>
        </View>
      ) : null}

      {viewModel.loadError ? (
        <Text style={styles.errorText}>{viewModel.loadError}</Text>
      ) : null}

      {viewModel.successMessage ? (
        <Text style={styles.successText}>{viewModel.successMessage}</Text>
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
    fontFamily: "InterMedium",
  },
  errorText: {
    color: colors.destructive,
    fontSize: 13,
    fontFamily: "InterSemiBold",
  },
  successText: {
    color: colors.success,
    fontSize: 13,
    fontFamily: "InterSemiBold",
  },
});
