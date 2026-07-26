import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { spacing } from "@/shared/components/theme/spacing";

type PasswordVisibilityButtonProps = {
  accessibilityLabel: string;
  disabled?: boolean;
  isPasswordVisible: boolean;
  onPress: () => void;
};

export function PasswordVisibilityButton({
  accessibilityLabel,
  disabled = false,
  isPasswordVisible,
  onPress,
}: PasswordVisibilityButtonProps) {
  const theme = useAppTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        button: {
          alignItems: "center",
          justifyContent: "center",
          padding: theme.scaleSpace(spacing.xs),
        },
        buttonDisabled: {
          opacity: 0.6,
        },
        buttonPressed: {
          opacity: 0.72,
        },
      }),
    [theme],
  );

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled ? styles.buttonDisabled : null,
        pressed && !disabled ? styles.buttonPressed : null,
      ]}
    >
      {isPasswordVisible ? (
        <EyeOff size={18} color={theme.colors.mutedForeground} />
      ) : (
        <Eye size={18} color={theme.colors.mutedForeground} />
      )}
    </Pressable>
  );
}
