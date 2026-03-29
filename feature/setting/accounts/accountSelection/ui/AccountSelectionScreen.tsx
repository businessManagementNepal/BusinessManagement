import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Briefcase, ChevronRight, Sparkles, User } from "lucide-react-native";
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
                <Pressable
                  key={account.remoteId}
                  style={[
                    styles.accountItem,
                    isSelected ? styles.accountItemSelected : undefined,
                  ]}
                  onPress={() => onSelectAccount(account.remoteId)}
                  accessibilityRole="button"
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
                </Pressable>
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

        <Pressable
          style={[
            styles.primaryButton,
            !canSubmit ? styles.primaryButtonDisabled : undefined,
          ]}
          onPress={() => {
            void onConfirmSelection();
          }}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit, busy: isSubmitting }}
        >
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? "Saving..." : "Continue"}
          </Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={onBackToLogin}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>Back To Login</Text>
        </Pressable>
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
    fontWeight: "800",
  },
  headerSubtitle: {
    color: colors.headerForeground,
    fontSize: 13,
    fontWeight: "500",
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
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  infoText: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontWeight: "500",
  },
  accountsList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  accountItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
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
    fontWeight: "700",
  },
  accountMeta: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "500",
  },
  defaultLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
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
    fontWeight: "600",
  },
  successText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: "600",
  },
  primaryButton: {
    marginTop: spacing.md,
    minHeight: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.primaryForeground,
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
  },
  secondaryButtonText: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "700",
  },
});
