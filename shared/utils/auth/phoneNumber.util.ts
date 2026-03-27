export const normalizePhoneNumber = (value: string): string => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  const digits = trimmedValue.replace(/\D/g, "");
  const hasLeadingPlus = trimmedValue.startsWith("+");

  return hasLeadingPlus ? `+${digits}` : digits;
};

export const composePhoneNumberWithDialCode = (
  phoneNumber: string,
  dialCode: string,
): string => {
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  if (!normalizedPhoneNumber) {
    return "";
  }

  if (normalizedPhoneNumber.startsWith("+")) {
    return normalizedPhoneNumber;
  }

  const normalizedDialCode = normalizePhoneNumber(dialCode);

  if (!normalizedDialCode.startsWith("+")) {
    return normalizedPhoneNumber;
  }

  const dialCodeDigits = normalizedDialCode.slice(1);

  if (normalizedPhoneNumber.startsWith(dialCodeDigits)) {
    return `+${normalizedPhoneNumber}`;
  }

  return `${normalizedDialCode}${normalizedPhoneNumber}`;
};
