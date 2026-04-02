import {
  PosBootstrap,
  PosCartLine,
  PosProduct,
  PosReceipt,
  PosTotals,
} from "../../../types/pos.entity.types";

export const mapPosProductToDomain = (product: PosProduct): PosProduct => ({
  ...product,
});

export const mapPosBootstrapToDomain = (bootstrap: PosBootstrap): PosBootstrap => ({
  ...bootstrap,
  products: bootstrap.products.map(mapPosProductToDomain),
  slots: bootstrap.slots.map((slot) => ({ ...slot })),
});

export const mapPosCartLinesToDomain = (
  cartLines: readonly PosCartLine[],
): readonly PosCartLine[] => cartLines.map((line) => ({ ...line }));

export const mapPosTotalsToDomain = (totals: PosTotals): PosTotals => ({
  ...totals,
});

export const mapPosReceiptToDomain = (receipt: PosReceipt): PosReceipt => ({
  ...receipt,
  lines: receipt.lines.map((line) => ({ ...line })),
  totals: { ...receipt.totals },
  ledgerEffect: { ...receipt.ledgerEffect },
});
