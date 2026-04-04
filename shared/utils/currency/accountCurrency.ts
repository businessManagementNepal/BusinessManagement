type CurrencyResolutionParams = {
  currencyCode?: string | null;
  countryCode?: string | null;
};

type CurrencyFormatParams = CurrencyResolutionParams & {
  amount: number;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

const COUNTRY_TO_CURRENCY_CODE_MAP: Record<string, string> = {
  NP: "NPR",
  IN: "INR",
};

const CURRENCY_PREFIX_MAP: Record<string, string> = {
  NPR: "Rs",
  INR: "INR",
};

export const DEFAULT_CURRENCY_CODE = "NPR";

export const resolveCurrencyCode = ({
  currencyCode,
  countryCode,
}: CurrencyResolutionParams): string => {
  const normalizedCurrencyCode = currencyCode?.trim().toUpperCase() ?? "";
  if (normalizedCurrencyCode.length === 3) {
    return normalizedCurrencyCode;
  }

  const normalizedCountryCode = countryCode?.trim().toUpperCase() ?? "";
  if (normalizedCountryCode.length === 2) {
    return COUNTRY_TO_CURRENCY_CODE_MAP[normalizedCountryCode] ?? DEFAULT_CURRENCY_CODE;
  }

  return DEFAULT_CURRENCY_CODE;
};

export const resolveCurrencyPrefix = (
  params: CurrencyResolutionParams,
): string => {
  const currencyCode = resolveCurrencyCode(params);
  return CURRENCY_PREFIX_MAP[currencyCode] ?? currencyCode;
};

export const formatCurrencyAmount = ({
  amount,
  currencyCode,
  countryCode,
  minimumFractionDigits = 0,
  maximumFractionDigits = 0,
}: CurrencyFormatParams): string => {
  const currencyPrefix = resolveCurrencyPrefix({ currencyCode, countryCode });
  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);

  return `${currencyPrefix} ${formattedAmount}`;
};
