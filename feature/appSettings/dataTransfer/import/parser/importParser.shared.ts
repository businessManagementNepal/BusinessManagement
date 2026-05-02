export const normalizeImportHeader = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

export const normalizeImportCellValue = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return value;
};

const finalizeDelimitedRow = (
  rows: string[][],
  currentRow: string[],
  currentValue: string,
): void => {
  currentRow.push(currentValue);
  rows.push([...currentRow]);
  currentRow.length = 0;
};

export const parseDelimitedText = (text: string): string[][] => {
  const rows: string[][] = [];
  const normalizedText = text.replace(/^\uFEFF/, "");
  const currentRow: string[] = [];
  let currentValue = "";
  let isInsideQuotedCell = false;

  for (let index = 0; index < normalizedText.length; index += 1) {
    const character = normalizedText[index];
    const nextCharacter = normalizedText[index + 1];

    if (character === "\"") {
      if (isInsideQuotedCell && nextCharacter === "\"") {
        currentValue += "\"";
        index += 1;
        continue;
      }

      isInsideQuotedCell = !isInsideQuotedCell;
      continue;
    }

    if (!isInsideQuotedCell && character === ",") {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if (!isInsideQuotedCell && (character === "\n" || character === "\r")) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      finalizeDelimitedRow(rows, currentRow, currentValue);
      currentValue = "";
      continue;
    }

    currentValue += character;
  }

  if (isInsideQuotedCell) {
    throw new Error("The selected CSV file has an unterminated quoted value.");
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    finalizeDelimitedRow(rows, currentRow, currentValue);
  }

  return rows;
};

const buildHeaderList = (headerRow: readonly unknown[]): string[] => {
  return headerRow.map((headerValue, index) => {
    const normalizedHeader = normalizeImportHeader(String(headerValue ?? ""));
    return normalizedHeader || `column_${index + 1}`;
  });
};

export const buildParsedRowsFromMatrix = (
  matrix: readonly (readonly unknown[])[],
): Record<string, unknown>[] => {
  if (matrix.length === 0) {
    return [];
  }

  const [headerRow, ...dataRows] = matrix;
  const headers = buildHeaderList(headerRow);

  return dataRows
    .map((row) => {
      const normalizedRow = row.map((value) => normalizeImportCellValue(value));
      const hasValue = normalizedRow.some((value) => value !== null);
      if (!hasValue) {
        return null;
      }

      return headers.reduce<Record<string, unknown>>((record, header, index) => {
        record[header] = normalizedRow[index] ?? null;
        return record;
      }, {});
    })
    .filter((row): row is Record<string, unknown> => row !== null);
};

export const getTextValue = (
  row: Record<string, unknown>,
  aliases: readonly string[],
): string | null => {
  for (const alias of aliases) {
    const value = row[alias];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return null;
};

export const getNumberValue = (
  row: Record<string, unknown>,
  aliases: readonly string[],
): number | null => {
  for (const alias of aliases) {
    const value = row[alias];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.trim().replace(/,/g, "");
      if (!normalized) {
        continue;
      }

      const parsed = Number(normalized);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
};

export const getBooleanValue = (
  row: Record<string, unknown>,
  aliases: readonly string[],
): boolean | null => {
  for (const alias of aliases) {
    const value = row[alias];
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true" || normalized === "yes" || normalized === "1") {
        return true;
      }

      if (normalized === "false" || normalized === "no" || normalized === "0") {
        return false;
      }
    }
  }

  return null;
};
