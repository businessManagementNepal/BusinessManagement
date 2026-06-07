import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Briefcase, ChevronRight, Sparkles, User } from "lucide-react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { CardPressable } from "@/shared/components/reusable/Cards/Card";
import { useToastMessage } from "@/shared/components/reusable/Feedback/useToastMessage";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import { AccountType } from "../types/accountSelection.types";
import { AccountSelectionViewModel } from "../viewModel/accountSelection.viewModel";

type AccountSelectionScreenProps = {
  viewModel: AccountSelectionViewModel;
};

const getAccountTypeLabel = (accountType: string): string => {
  if (accountType === AccountType.Business) {
    return "Business";
  }

  return "Personal";
};

export function AccountSelectionScreen({ viewModel }: AccountSelectionScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {
    accounts,
    selectedAccountRemoteId,
    isLoading,
    isSubmitting,
    submitError,
    successMessage,
    onSelectAccount,
    onConfirmSelection,
    onBackToLogin,
  } = viewModel;

  useToastMessage({
    message: submitError,
    type: "error",
  });
  useToastMessage({
    message: successMessage,
    type: "success",
  });

  const canSubmit = useMemo(() => {
    return (
      !isLoading &&
      !isSubmitting &&
      accounts.length > 0 &&
      Boolean(selectedAccountRemoteId)
    );
  }, [accounts.length, isLoading, isSubmitting, selectedAccountRemoteId]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Sparkles size={28} color={theme.colors.headerForeground} />
        </View>
        <Text style={styles.headerTitle}>Welcome to eLekha</Text>
        <Text style={styles.headerSubtitle}>
          Choose an account to get started
        </Text>
      </View>
      <View style={styles.headerDivider} />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Your Accounts</Text>

        {isLoading ? <Text style={styles.infoText}>Loading your accounts...</Text> : null}

        {!isLoading && accounts.length > 0 ? (
          <View style={styles.accountsList}>
            {accounts.map((account) => {
              const isSelected = selectedAccountRemoteId === account.remoteId;
              const iconColor = isSelected
                ? theme.colors.primary
                : theme.colors.mutedForeground;
              const accountMetaLocation = account.cityOrLocation?.trim();

              return (
                <CardPressable
                  key={account.remoteId}
                  style={[
                    styles.accountItem,
                    isSelected ? styles.accountItemSelected : undefined,
                  ]}
                  onPress={() => onSelectAccount(account.remoteId)}
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.accountIconWrap}>
                    {account.accountType === AccountType.Business ? (
                      <Briefcase size={20} color={iconColor} />
                    ) : (
                      <User size={20} color={iconColor} />
                    )}
                  </View>

                  <View style={styles.accountBody}>
                    <Text style={styles.accountTitle}>{account.displayName}</Text>
                    <Text style={styles.accountMeta}>
                      {getAccountTypeLabel(account.accountType)}
                      {accountMetaLocation ? ` - ${accountMetaLocation}` : ""}
                    </Text>
                    {account.isDefault ? (
                      <Text style={styles.defaultLabel}>Default account</Text>
                    ) : null}
                  </View>

                  <ChevronRight size={18} color={theme.colors.mutedForeground} />
                </CardPressable>
              );
            })}
          </View>
        ) : null}

        {!isLoading && accounts.length === 0 ? (
          <Text style={styles.emptyStateText}>
            No accounts available for this profile. Please sign in again.
          </Text>
        ) : null}

        <AppButton
          label={isSubmitting ? "Saving..." : "Continue"}
          variant="primary"
          size="md"
          style={[
            styles.primaryButton,
            !canSubmit ? styles.primaryButtonDisabled : undefined,
          ]}
          onPress={() => {
            void onConfirmSelection();
          }}
          disabled={!canSubmit}
          accessibilityState={{ disabled: !canSubmit, busy: isSubmitting }}
        />

        <AppButton
          label="Back To Login"
          variant="secondary"
          size="md"
          style={styles.secondaryButton}
          onPress={onBackToLogin}
        />
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.header,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.scaleSpace(spacing.xl),
      paddingTop: theme.scaleSpace(spacing.xxl * 2),
      paddingBottom: theme.scaleSpace(spacing.xxl),
      gap: theme.scaleSpace(spacing.xs),
    },
    headerIconWrap: {
      width: 64,
      height: 64,
      borderRadius: radius.lg,
      backgroundColor: "rgba(255,255,255,0.18)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.scaleSpace(spacing.sm),
    },
    headerTitle: {
      color: theme.colors.headerForeground,
      fontSize: theme.scaleText(28),
      fontFamily: "InterBold",
    },
    headerSubtitle: {
      color: theme.colors.headerForeground,
      fontSize: theme.scaleText(13),
      fontFamily: "InterMedium",
      opacity: 0.9,
    },
    headerDivider: {
      height: 4,
      width: "100%",
      backgroundColor: theme.colors.destructive,
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      width: "100%",
      paddingHorizontal: theme.scaleSpace(spacing.lg),
      paddingTop: theme.scaleSpace(spacing.lg),
      paddingBottom: theme.scaleSpace(spacing.xl),
      gap: theme.scaleSpace(spacing.sm),
    },
    sectionTitle: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      fontFamily: "InterBold",
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: theme.scaleSpace(spacing.xs),
    },
    infoText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
      fontFamily: "InterMedium",
    },
    accountsList: {
      gap: theme.scaleSpace(spacing.sm),
      marginBottom: theme.scaleSpace(spacing.md),
    },
    accountItem: {
      paddingVertical: theme.scaleSpace(spacing.md) + 2,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.sm),
    },
    accountItemSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.accent,
    },
    accountIconWrap: {
      width: 48,
      height: 48,
      borderRadius: radius.pill,
      backgroundColor: theme.colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    accountBody: {
      flex: 1,
      gap: 2,
    },
    accountTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(15),
      fontFamily: "InterBold",
    },
    accountMeta: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      fontFamily: "InterMedium",
    },
    defaultLabel: {
      color: theme.colors.primary,
      fontSize: theme.scaleText(12),
      fontFamily: "InterBold",
    },
    emptyStateText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(14),
      lineHeight: theme.scaleLineHeight(20),
      marginBottom: theme.scaleSpace(spacing.md),
    },
    primaryButton: {
      marginTop: theme.scaleSpace(spacing.md),
    },
    primaryButtonDisabled: {
      opacity: 0.6,
    },
    secondaryButton: {
      marginTop: theme.scaleSpace(spacing.xs),
    },
  });

