import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LogOut } from "lucide-react-native";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";

type ProfileActionsSectionProps = {
  onLogout: () => Promise<void>;
};

export function ProfileActionsSection({
  onLogout,
}: ProfileActionsSectionProps) {
  return (
    <View style={styles.actionsCard}>
      <Pressable
        style={styles.actionRow}
        onPress={() => {
          void onLogout();
        }}
        accessibilityRole="button"
      >
        <View style={styles.actionIconWrap}>
          <LogOut size={18} color={colors.destructive} />
        </View>
        <View style={styles.actionBody}>
          <Text style={styles.logoutTitle}>Logout</Text>
          <Text style={styles.actionSubtitle}>Sign out from this device</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actionsCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    overflow: "hidden",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  actionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBody: {
    flex: 1,
  },
  logoutTitle: {
    color: colors.destructive,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  actionSubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
});
