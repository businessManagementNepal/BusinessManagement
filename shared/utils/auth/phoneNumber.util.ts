export const normalizePhoneNumber = (value: string): string => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  const digits = trimmedValue.replace(/\D/g, "");
  const hasLeadingPlus = trimmedValue.startsWith("+");

  return hasLeadingPlus ? `+${digits}` : digits;
};
