import React from "react";
import { TextInputProps } from "react-native";
import { Lock } from "lucide-react-native";
import { Control, FieldValues, Path } from "react-hook-form";
import { TextField } from "@/shared/components/reusable/Form/TextField";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { PasswordVisibilityButton } from "./PasswordVisibilityButton";

interface AuthPasswordFieldProps<TFieldValues extends FieldValues>
  extends Omit<TextInputProps, "value" | "onChangeText" | "onBlur"> {
  control: Control<TFieldValues>;
  isPasswordVisible: boolean;
  name: Path<TFieldValues>;
  onTogglePasswordVisibility: () => void;
  onValueChange?: (value: string) => void;
  visibilityAccessibilityLabel?: string;
}

function AuthPasswordFieldComponent<TFieldValues extends FieldValues>({
  control,
  isPasswordVisible,
  name,
  onTogglePasswordVisibility,
  onValueChange,
  visibilityAccessibilityLabel = "Toggle password visibility",
  ...inputProps
}: AuthPasswordFieldProps<TFieldValues>) {
  const theme = useAppTheme();

  return (
    <TextField<TFieldValues>
      autoCapitalize="none"
      autoCorrect={false}
      control={control}
      keyboardType="default"
      leftIcon={<Lock size={18} color={theme.colors.mutedForeground} />}
      name={name}
      onValueChange={onValueChange}
      rightIcon={
        <PasswordVisibilityButton
          accessibilityLabel={visibilityAccessibilityLabel}
          disabled={inputProps.editable === false}
          isPasswordVisible={isPasswordVisible}
          onPress={onTogglePasswordVisibility}
        />
      }
      secureTextEntry={!isPasswordVisible}
      {...inputProps}
    />
  );
}

export const AuthPasswordField = React.memo(
  AuthPasswordFieldComponent,
) as typeof AuthPasswordFieldComponent;
