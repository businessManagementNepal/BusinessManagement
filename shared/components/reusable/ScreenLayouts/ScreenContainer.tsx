import React from "react";
import {
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { colors } from "../../theme/colors";

interface ScreenContainerProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padded?: boolean;
  showDivider?: boolean;
  dividerColor?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, "contentContainerStyle">;
  baseBottomPadding?: number;
}

export function ScreenContainer({
  children,
  header,
  footer,
  padded = false,
  showDivider = true,
  dividerColor = colors.destructive,
  contentContainerStyle,
  scrollProps,
  baseBottomPadding = 110,
}: ScreenContainerProps) {
  return (
    <View style={styles.container}>
      {header}
      {showDivider ? <View style={[styles.divider, { backgroundColor: dividerColor }]} /> : null}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: baseBottomPadding },
          padded ? styles.padded : null,
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        {...scrollProps}
      >
        {children}
      </ScrollView>
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  divider: {
    height: 4,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  padded: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
