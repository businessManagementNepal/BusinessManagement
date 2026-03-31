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
import { colors } from "../../theme/colors";
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
                placeholderTextColor={colors.mutedForeground}
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

const styles = StyleSheet.create({
  wrapper: {
    minHeight: 54,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  wrapperError: {
    borderColor: colors.destructive,
  },
  side: {
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    color: colors.cardForeground,
    fontSize: 14,
    paddingVertical: 14,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 12,
    fontFamily: "InterMedium",
    marginTop: 6,
  },
});

