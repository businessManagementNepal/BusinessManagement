import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "@/shared/components/theme/colors";
import { fontFamily } from "@/shared/components/theme/typography";
import { spacing } from "@/shared/components/theme/spacing";

export function StartupLoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primaryForeground} />
      <Text style={styles.title}>Starting e-Lekha</Text>
      <Text style={styles.subtitle}>
        Preparing your app safely. Please wait.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  title: {
    marginTop: spacing.lg,
    color: colors.primaryForeground,
    fontFamily: fontFamily.bold,
    fontSize: 20,
    textAlign: "center",
  },
  subtitle: {
    marginTop: spacing.sm,
    color: "rgba(255,255,255,0.82)",
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
