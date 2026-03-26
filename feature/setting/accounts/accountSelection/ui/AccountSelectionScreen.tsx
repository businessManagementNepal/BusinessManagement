import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/shared/components/theme/colors";

type AccountSelectionScreenProps = {
  onBackToLogin: () => void;
};

export function AccountSelectionScreen({
  onBackToLogin,
}: AccountSelectionScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Account Setup</Text>
        <Text style={styles.description}>
          Account selection is the next step after login. Configure your account flow
          here before wiring business profile and role data.
        </Text>

        <Pressable
          style={styles.secondaryButton}
          onPress={onBackToLogin}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>Back To Login</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 20,
    gap: 12,
  },
  title: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: "800",
  },
  description: {
    color: colors.mutedForeground,
    fontSize: 14,
    lineHeight: 20,
  },
  secondaryButton: {
    marginTop: 8,
    minHeight: 44,
    borderRadius: 12,
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
