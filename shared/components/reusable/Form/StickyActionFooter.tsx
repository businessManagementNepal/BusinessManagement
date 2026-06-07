import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";

type StickyActionFooterProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function StickyActionFooter({
  children,
  style,
}: StickyActionFooterProps) {
  const styles = useThemedStyles(createStyles);

  return <View style={[styles.container, style]}>{children}</View>;
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.sm),
    },
  });
