import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { spacing } from "@/shared/components/theme/spacing";

type FormModalActionFooterProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function FormModalActionFooter({
  children,
  style,
}: FormModalActionFooterProps) {
  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
