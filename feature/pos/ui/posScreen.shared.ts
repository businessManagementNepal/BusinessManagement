import { PosProduct } from "../types/pos.entity.types";
import { formatCurrencyAmount } from "@/shared/utils/currency/accountCurrency";

export const formatCurrency = (
  amount: number,
  currencyCode: string | null,
  countryCode: string | null,
): string => {
  return formatCurrencyAmount({
    amount,
    currencyCode,
    countryCode,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

export const buildSlotProductLookup = (
  products: readonly PosProduct[],
): Record<string, PosProduct> => {
  return products.reduce<Record<string, PosProduct>>((lookup, product) => {
    lookup[product.id] = product;
    return lookup;
  }, {});
};
