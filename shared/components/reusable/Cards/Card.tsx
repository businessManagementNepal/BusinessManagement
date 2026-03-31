import React from "react";
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { colors } from "../../theme/colors";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface CardPressableProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style, styles.cardSurface]}>{children}</View>;
}

export function CardPressable({
  children,
  style,
  disabled,
  accessibilityRole,
  ...props
}: CardPressableProps) {
  return (
    <Pressable
      {...props}
      disabled={disabled}
      accessibilityRole={accessibilityRole ?? "button"}
      style={({ pressed }) => [
        styles.card,
        style,
        styles.cardSurface,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardSurface: {
    borderRadius: 7,
  },
  pressed: {
    opacity: 0.88,
  },
});
