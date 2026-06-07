import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { ProfileScreenViewModel } from "@/feature/profile/screen/viewModel/profileScreen.viewModel";
import { useToastMessage } from "@/shared/components/reusable/Feedback/useToastMessage";
import { PrimaryHeader } from "@/shared/components/reusable/ScreenLayouts/PrimaryHeader";
import { ScreenContainer } from "@/shared/components/reusable/ScreenLayouts/ScreenContainer";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
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
      keyboardSafe={true}
    >
      {viewModel.isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading business details...</Text>
        </View>
      ) : null}

      {viewModel.loadError ? (
        <Text style={styles.errorText}>{viewModel.loadError}</Text>
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

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    scrollContent: {
      paddingHorizontal: theme.scaleSpace(spacing.lg),
      paddingTop: theme.scaleSpace(spacing.lg),
      gap: theme.scaleSpace(spacing.sm),
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
      fontFamily: "InterMedium",
    },
    errorText: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(13),
      fontFamily: "InterSemiBold",
    },
  });
