import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { spacing } from "@/shared/components/theme/spacing";

type AuthAccountSwitchActionProps = {
  actionLabel: string;
  message: string;
  onPress: () => void;
};

export function AuthAccountSwitchAction({
  actionLabel,
  message,
  onPress,
}: AuthAccountSwitchActionProps) {
  const theme = useAppTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        footerLink: {
          color: theme.colors.primary,
          fontFamily: "InterSemiBold",
          fontSize: theme.scaleText(12),
        },
        footerRow: {
          alignItems: "center",
          flexDirection: "row",
          gap: theme.scaleSpace(spacing.xs),
          justifyContent: "center",
        },
        footerText: {
          color: theme.colors.mutedForeground,
          fontFamily: "InterMedium",
          fontSize: theme.scaleText(12),
        },
        linkPressed: {
          opacity: 0.72,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.footerRow}>
      <Text style={styles.footerText}>{message}</Text>
      <Pressable
        accessibilityLabel={actionLabel}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => (pressed ? styles.linkPressed : null)}
      >
        <Text style={styles.footerLink}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}
