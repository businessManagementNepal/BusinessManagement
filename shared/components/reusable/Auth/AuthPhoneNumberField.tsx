import React from "react";
import { StyleSheet, TextInputProps, View } from "react-native";
import { Phone } from "lucide-react-native";
import { Control, FieldValues, Path } from "react-hook-form";
import {
  Dropdown,
  type DropdownOption,
} from "@/shared/components/reusable/DropDown/Dropdown";
import { TextField } from "@/shared/components/reusable/Form/TextField";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import {
  AuthPhoneCountryCode,
  AuthPhoneCountryOption,
} from "@/shared/constants/authPhone.constants";

interface AuthPhoneNumberFieldProps<TFieldValues extends FieldValues>
  extends Omit<TextInputProps, "value" | "onChangeText" | "onBlur"> {
  control: Control<TFieldValues>;
  countryModalTitle?: string;
  countryPlaceholder?: string;
  name: Path<TFieldValues>;
  onChangeSelectedPhoneCountry: (countryCode: AuthPhoneCountryCode) => void;
  onValueChange?: (value: string) => void;
  phoneCountryOptions: readonly AuthPhoneCountryOption[];
  phoneNumberMaxLength: number;
  selectedPhoneCountryCode: AuthPhoneCountryCode;
}

function AuthPhoneNumberFieldComponent<TFieldValues extends FieldValues>({
  control,
  countryModalTitle = "Choose country",
  countryPlaceholder = "Country",
  name,
  onChangeSelectedPhoneCountry,
  onValueChange,
  phoneCountryOptions,
  phoneNumberMaxLength,
  selectedPhoneCountryCode,
  ...inputProps
}: AuthPhoneNumberFieldProps<TFieldValues>) {
  const theme = useAppTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        row: {
          alignItems: "flex-start",
          flexDirection: "row",
          gap: theme.scaleSpace(spacing.sm),
        },
        phoneCountryDropdownText: {
          color: theme.colors.cardForeground,
          fontFamily: "InterSemiBold",
          fontSize: theme.scaleText(13),
        },
        phoneCountryDropdownTrigger: {
          borderRadius: radius.lg,
          minHeight: theme.scaleSpace(54),
        },
        phoneCountryDropdownWrap: {
          width: 152,
        },
        phoneNumberInputWrap: {
          flex: 1,
        },
      }),
    [theme],
  );

  const dropdownOptions = React.useMemo<DropdownOption[]>(
    () =>
      phoneCountryOptions.map((option) => ({
        label: `${option.flag} ${option.label}`,
        value: option.code,
      })),
    [phoneCountryOptions],
  );

  const handlePhoneCountryChange = React.useCallback(
    (nextCountryCode: string): void => {
      const selectedCountryOption = phoneCountryOptions.find(
        (option) => option.code === nextCountryCode,
      );

      if (!selectedCountryOption) {
        return;
      }

      onChangeSelectedPhoneCountry(selectedCountryOption.code);
    },
    [onChangeSelectedPhoneCountry, phoneCountryOptions],
  );

  return (
    <View style={styles.row}>
      <View style={styles.phoneCountryDropdownWrap}>
        <Dropdown
          disabled={inputProps.editable === false}
          modalTitle={countryModalTitle}
          onChange={handlePhoneCountryChange}
          options={dropdownOptions}
          placeholder={countryPlaceholder}
          showLeadingIcon={false}
          triggerStyle={styles.phoneCountryDropdownTrigger}
          triggerTextStyle={styles.phoneCountryDropdownText}
          value={selectedPhoneCountryCode}
        />
      </View>

      <View style={styles.phoneNumberInputWrap}>
        <TextField<TFieldValues>
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          control={control}
          importantForAutofill="no"
          keyboardType="number-pad"
          leftIcon={<Phone size={18} color={theme.colors.mutedForeground} />}
          maxLength={phoneNumberMaxLength}
          name={name}
          onValueChange={onValueChange}
          {...inputProps}
        />
      </View>
    </View>
  );
}

export const AuthPhoneNumberField = React.memo(
  AuthPhoneNumberFieldComponent,
) as typeof AuthPhoneNumberFieldComponent;
