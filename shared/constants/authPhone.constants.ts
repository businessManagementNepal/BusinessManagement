export const AUTH_PHONE_COUNTRY_CODES = ["NP", "IN"] as const;

export type AuthPhoneCountryCode =
  (typeof AUTH_PHONE_COUNTRY_CODES)[number];

export type AuthPhoneCountryOption = {
  code: AuthPhoneCountryCode;
  dialCode: string;
  label: string;
  flag: string;
};

export const AUTH_PHONE_COUNTRY_OPTIONS: readonly AuthPhoneCountryOption[] = [
  {
    code: "NP",
    dialCode: "+977",
    label: "Nepal (+977)",
    flag: "\uD83C\uDDF3\uD83C\uDDF5",
  },
  {
    code: "IN",
    dialCode: "+91",
    label: "India (+91)",
    flag: "\uD83C\uDDEE\uD83C\uDDF3",
  },
];
