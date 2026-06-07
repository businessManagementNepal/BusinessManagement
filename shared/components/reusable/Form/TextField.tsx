import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { radius } from "../../theme/spacing";

interface TextFieldProps<TFieldValues extends FieldValues>
  extends Omit<TextInputProps, "value" | "onChangeText" | "onBlur"> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onValueChange?: (value: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  containerTestID?: string;
  errorTestID?: string;
}

function TextFieldComponent<TFieldValues extends FieldValues>({
  control,
  name,
  leftIcon,
  rightIcon,
  onValueChange,
  containerStyle,
  inputStyle,
  containerTestID,
  errorTestID,
  placeholder,
  secureTextEntry = false,
  autoCapitalize = "none",
  autoCorrect = false,
  accessibilityState,
  style,
  ...inputProps
}: TextFieldProps<TFieldValues>) {
  const theme = useAppTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          minHeight: theme.scaleSpace(54),
          backgroundColor: theme.colors.card,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          paddingHorizontal: theme.scaleSpace(12),
          flexDirection: "row",
          alignItems: "center",
          gap: theme.scaleSpace(10),
        },
        wrapperError: {
          borderColor: theme.colors.destructive,
        },
        side: {
          minWidth: theme.scaleSpace(20),
          alignItems: "center",
          justifyContent: "center",
        },
        input: {
          flex: 1,
          color: theme.colors.cardForeground,
          fontSize: theme.scaleText(14),
          lineHeight: theme.scaleLineHeight(18),
          paddingVertical: theme.scaleSpace(14),
          fontFamily: "InterMedium",
        },
        errorText: {
          color: theme.colors.destructive,
          fontSize: theme.scaleText(12),
          lineHeight: theme.scaleLineHeight(16),
          fontFamily: "InterMedium",
          marginTop: theme.scaleSpace(6),
        },
      }),
    [theme],
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onBlur, onChange, value }, fieldState }) => {
        const displayValue =
          value === null || value === undefined ? "" : String(value);
        const errorMessage = fieldState.error?.message;
        const hasError = Boolean(errorMessage);

        return (
          <View style={containerStyle} testID={containerTestID}>
            <View style={[styles.wrapper, hasError ? styles.wrapperError : null]}>
              {leftIcon ? <View style={styles.side}>{leftIcon}</View> : null}
              <TextInput
                {...inputProps}
                placeholder={placeholder}
                placeholderTextColor={theme.colors.mutedForeground}
                style={[styles.input, style, inputStyle]}
                secureTextEntry={secureTextEntry}
                autoCapitalize={autoCapitalize}
                autoCorrect={autoCorrect}
                value={displayValue}
                onBlur={onBlur}
                onChangeText={(nextValue) => {
                  onChange(nextValue);

                  if (onValueChange) {
                    onValueChange(nextValue);
                  }
                }}
                blurOnSubmit={inputProps.blurOnSubmit}
                accessibilityState={accessibilityState}
              />
              {rightIcon ? <View style={styles.side}>{rightIcon}</View> : null}
            </View>

            {hasError ? (
              <Text style={styles.errorText} testID={errorTestID}>
                {errorMessage}
              </Text>
            ) : null}
          </View>
        );
      }}
    />
  );
}

export const TextField = React.memo(
  TextFieldComponent,
) as typeof TextFieldComponent;

