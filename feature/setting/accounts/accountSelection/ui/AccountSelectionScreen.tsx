import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Briefcase, ChevronRight, Sparkles, User } from "lucide-react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { CardPressable } from "@/shared/components/reusable/Cards/Card";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
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
          <Sparkles size={28} color={colors.headerForeground} />
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
              const iconColor = isSelected ? colors.primary : colors.mutedForeground;
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

                  <ChevronRight size={18} color={colors.mutedForeground} />
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

        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
        {successMessage ? (
          <Text style={styles.successText}>{successMessage}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.header,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.xxl,
    gap: spacing.xs,
  },
  headerIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  headerTitle: {
    color: colors.headerForeground,
    fontSize: 28,
    fontFamily: "InterBold",
  },
  headerSubtitle: {
    color: colors.headerForeground,
    fontSize: 13,
    fontFamily: "InterMedium",
    opacity: 0.9,
  },
  headerDivider: {
    height: 4,
    width: "100%",
    backgroundColor: colors.destructive,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    width: "100%",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterBold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  infoText: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontFamily: "InterMedium",
  },
  accountsList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  accountItem: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  accountItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.accent,
  },
  accountIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  accountBody: {
    flex: 1,
    gap: 2,
  },
  accountTitle: {
    color: colors.cardForeground,
    fontSize: 15,
    fontFamily: "InterBold",
  },
  accountMeta: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  defaultLabel: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: "InterBold",
  },
  emptyStateText: {
    color: colors.mutedForeground,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
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
  primaryButton: {
    marginTop: spacing.md,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    marginTop: spacing.xs,
  },
});

