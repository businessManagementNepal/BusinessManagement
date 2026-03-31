import React from "react";
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/spacing";

type AppIconButtonSize = "sm" | "md";

type AppIconButtonProps = Omit<PressableProps, "style"> & {
  children: React.ReactNode;
  size?: AppIconButtonSize;
  style?: StyleProp<ViewStyle>;
};

export function AppIconButton({
  children,
  size = "sm",
  style,
  disabled,
  accessibilityRole,
  ...props
}: AppIconButtonProps) {
  return (
    <Pressable
      {...props}
      disabled={disabled}
      accessibilityRole={accessibilityRole ?? "button"}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sm: {
    width: 30,
    height: 30,
  },
  md: {
    width: 34,
    height: 34,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.88,
  },
});
