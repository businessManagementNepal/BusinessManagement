import React from "react";
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboardInset } from "@/shared/components/reusable/layout/useKeyboardInset";

type KeyboardSafeEditableScreenProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
  bottomInsetPadding?: number;
};

export function KeyboardSafeEditableScreen({
  children,
  style,
  contentContainerStyle,
  keyboardVerticalOffset = 0,
  bottomInsetPadding = 24,
}: KeyboardSafeEditableScreenProps) {
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardInset();
  const keyboardOffset = Math.max(keyboardInset - insets.bottom, 0);

  return (
    <ScrollView
      style={[styles.scroll, style]}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom:
            Math.max(insets.bottom, bottomInsetPadding) + keyboardOffset,
          paddingTop: keyboardVerticalOffset,
        },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});
