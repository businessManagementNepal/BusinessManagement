import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Building2, Check, ChevronDown, User } from "lucide-react-native";
import {
  AccountType,
  AccountTypeValue,
} from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import { ProfileAccountOption } from "@/feature/profile/screen/types/profileScreen.types";
import { Card, CardPressable } from "@/shared/components/reusable/Cards/Card";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";

type AccountSwitchSectionProps = {
  activeAccountTypeLabel: string;
  activeAccountDisplayName: string;
  activeAccountRemoteId: string | null;
  accountOptions: readonly ProfileAccountOption[];
  isSwitchExpanded: boolean;
  onToggleSwitchExpanded: () => void;
  onSelectAccount: (accountRemoteId: string) => Promise<void>;
};

const renderAccountTypeIcon = (accountType: AccountTypeValue) => {
  if (accountType === AccountType.Business) {
    return <Building2 size={16} color={colors.primary} />;
  }

  return <User size={16} color={colors.primary} />;
};

const getActiveAccountType = (
  activeAccountTypeLabel: string,
  accountOptions: readonly {
    remoteId: string;
    accountType: AccountTypeValue;
  }[],
  activeAccountRemoteId: string | null,
): AccountTypeValue => {
  const activeAccount = accountOptions.find(
    (accountOption) => accountOption.remoteId === activeAccountRemoteId,
  );

  if (activeAccount) {
    return activeAccount.accountType;
  }

  if (activeAccountTypeLabel === "Business") {
    return AccountType.Business;
  }

  return AccountType.Personal;
};

export function AccountSwitchSection({
  activeAccountTypeLabel,
  activeAccountDisplayName,
  activeAccountRemoteId,
  accountOptions,
  isSwitchExpanded,
  onToggleSwitchExpanded,
  onSelectAccount,
}: AccountSwitchSectionProps) {
  return (
    <View style={styles.accountSwitchWrap}>
      <CardPressable
        style={styles.accountSwitchButton}
        onPress={onToggleSwitchExpanded}
      >
        <View style={styles.accountSwitchLeft}>
          <View style={styles.accountIconWrap}>
            {renderAccountTypeIcon(
              getActiveAccountType(
                activeAccountTypeLabel,
                accountOptions,
                activeAccountRemoteId,
              ),
            )}
          </View>

          <View>
            <Text style={styles.accountTitle}>{activeAccountTypeLabel} Account</Text>
            <Text style={styles.accountSubtitle}>
              {activeAccountDisplayName || "No active account"}
            </Text>
          </View>
        </View>

        <ChevronDown
          size={16}
          color={colors.mutedForeground}
          style={isSwitchExpanded ? styles.chevronOpen : undefined}
        />
      </CardPressable>

      {isSwitchExpanded ? (
        <Card style={styles.accountOptionsCard}>
          {accountOptions.map((accountOption) => {
            const isActive = accountOption.remoteId === activeAccountRemoteId;

            return (
              <Pressable
                key={accountOption.remoteId}
                style={styles.accountOptionRow}
                onPress={() => {
                  void onSelectAccount(accountOption.remoteId);
                }}
                accessibilityRole="button"
              >
                {renderAccountTypeIcon(accountOption.accountType)}

                <View style={styles.accountOptionBody}>
                  <Text style={styles.accountOptionTitle}>
                    {accountOption.displayName}
                  </Text>
                  <Text style={styles.accountOptionSubtitle}>
                    {accountOption.accountType === AccountType.Business
                      ? "Business"
                      : "Personal"}
                    {accountOption.isDefault ? " - Default" : ""}
                  </Text>
                </View>

                {isActive ? <Check size={14} color={colors.success} /> : null}
              </Pressable>
            );
          })}
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  accountSwitchWrap: {
    gap: 2,
  },
  accountSwitchButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accountSwitchLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  accountIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  accountTitle: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  accountSubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginTop: 2,
  },
  chevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  accountOptionsCard: {
    padding: 0,
  },
  accountOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  accountOptionBody: {
    flex: 1,
  },
  accountOptionTitle: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterBold",
    marginBottom: 2,
  },
  accountOptionSubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
});

